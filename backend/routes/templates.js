const express = require('express');
const Template = require('../models/Template');
const { auth, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');
const { generatePhishingTemplate } = require('../services/aiService');

const router = express.Router();

// GET /api/templates - templates for user's org
router.get('/', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const templates = await Template.find({ 
      $or: [
        { organization_id: req.user.organization_id },
        { is_predefined: true }
      ]
    })
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/templates/:id
router.get('/:id', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const template = await Template.findOne({ 
      _id: req.params.id, 
      $or: [
        { organization_id: req.user.organization_id },
        { is_predefined: true }
      ]
    })
      .populate('created_by', 'name email');
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/templates/create
router.post('/create', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const { template_name, description, phishing_link, difficulty_level, html_code, target_button_id } = req.body;
    const orgId = req.user.organization_id;
    const template = await Template.create({
      template_name,
      description: description || '',
      phishing_link: phishing_link || '',
      html_code: html_code || '',
      target_button_id: target_button_id || '',
      difficulty_level: difficulty_level || 'medium',
      created_by: req.user._id,
      organization_id: orgId
    });
    await logAudit(req.user._id, 'create', 'template', template._id, `Created template: ${template_name}`, orgId);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/templates/update/:id
router.put('/update/:id', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id, $or: [{ organization_id: req.user.organization_id }, { is_predefined: true }] }
      : { _id: req.params.id, organization_id: req.user.organization_id };
      
    const template = await Template.findOneAndUpdate(query, req.body, { new: true });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    await logAudit(req.user._id, 'update', 'template', template._id, `Updated template: ${template.template_name}`, req.user.organization_id);
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/templates/delete/:id
router.delete('/delete/:id', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const template = await Template.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    if (template.is_predefined) {
      return res.status(403).json({ message: 'Cannot delete predefined system templates' });
    }
    await Template.findByIdAndDelete(template._id);
    await logAudit(req.user._id, 'delete', 'template', template._id, `Deleted template: ${template.template_name}`, req.user.organization_id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/templates/generate-ai
router.post('/generate-ai', auth, authorize('admin', 'cybersecurity'), async (req, res) => {
  try {
    const { theme, department, difficulty } = req.body;
    const validThemes = ['password-reset', 'invoice-payment', 'hr-policy', 'delivery-notification'];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({ message: `Invalid theme. Valid themes: ${validThemes.join(', ')}` });
    }
    const generated = generatePhishingTemplate(theme, department || 'General', difficulty || 'medium');
    const orgId = req.user.organization_id;

    const template = await Template.create({
      ...generated,
      created_by: req.user._id,
      organization_id: orgId
    });
    await logAudit(req.user._id, 'create', 'template', template._id, `AI generated template: ${template.template_name}`, orgId);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
