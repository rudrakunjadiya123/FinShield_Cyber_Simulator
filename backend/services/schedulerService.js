const Campaign = require('../models/Campaign');
const User = require('../models/User');
const InteractionLog = require('../models/InteractionLog');
const TrackingToken = require('../models/TrackingToken');
const { sendPhishingEmail } = require('./emailService');
const { logAudit } = require('./auditService');
const { v4: uuidv4 } = require('uuid');

const checkScheduledCampaigns = async () => {
  try {
    const now = new Date();
    // Find all 'scheduled' campaigns where the launch_date is in the past
    // Also grab 'draft' campaigns with past launch_date just in case the UI sets them
    const campaigns = await Campaign.find({
      status: { $in: ['scheduled', 'draft'] },
      launch_date: { $lte: now }
    }).populate('template_id');

    for (const campaign of campaigns) {
      console.log(`[Scheduler] Auto-launching campaign: ${campaign.name}`);
      
      const targetUsers = await User.find({
        department: { $in: campaign.target_departments },
        role: 'employee',
        organization_id: campaign.organization_id
      });

      if (targetUsers.length === 0) {
        console.log(`[Scheduler] No targets found for ${campaign.name}`);
        campaign.status = 'completed';
        await campaign.save();
        continue;
      }

      campaign.status = 'running';
      await campaign.save();

      for (const user of targetUsers) {
        const trackingToken = uuidv4();

        // Create TrackingToken document for this user+campaign
        await TrackingToken.create({
          token: trackingToken,
          user_id: user._id,
          campaign_id: campaign._id,
          organization_id: campaign.organization_id
        });

        // Create InteractionLog to track all interactions
        await InteractionLog.create({
          user_id: user._id,
          campaign_id: campaign._id,
          organization_id: campaign.organization_id,
          tracking_token: trackingToken
        });

        await sendPhishingEmail(
          campaign,
          user,
          campaign.template_id,
          trackingToken,
          campaign.organization_id
        );
      }

      await logAudit(campaign.created_by, 'launch', 'campaign', campaign._id,
        `Auto-launched scheduled campaign to ${targetUsers.length} users`, campaign.organization_id);
      
      console.log(`[Scheduler] Completed launch for ${campaign.name}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error during auto-launch check:', error.message);
  }
};

const startScheduler = () => {
  // Run the check every minute (60,000 ms)
  setInterval(checkScheduledCampaigns, 60000);
  console.log('Campaign auto-launch scheduler started!');
  
  // Immedaitely try on startup just in case
  setTimeout(() => checkScheduledCampaigns(), 5000);
};

module.exports = { startScheduler };
