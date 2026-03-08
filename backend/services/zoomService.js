const axios = require('axios');

// Zoom API Configuration
const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

class ZoomService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get OAuth Access Token (Server-to-Server OAuth)
  async getAccessToken() {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
      
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        new URLSearchParams({
          grant_type: 'account_credentials',
          account_id: ZOOM_ACCOUNT_ID
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Zoom OAuth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  // Create a new Zoom meeting
  async createMeeting(scheduleData) {
    const token = await this.getAccessToken();
    
    const meetingConfig = {
      topic: scheduleData.title,
      type: 2,  // Scheduled meeting
      start_time: this.formatDateTime(scheduleData.sessionDate, scheduleData.time),
      duration: scheduleData.duration || 60,
      timezone: 'Asia/Karachi',  // Pakistan timezone
      password: this.generatePassword(),
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,  // Security: Wait for teacher
        mute_upon_entry: true,
        waiting_room: true,  // Security: Waiting room enabled
        breakout_room: { enable: false },
        auto_recording: 'cloud',  // Auto record to cloud
        alternative_hosts: '',
        registrants_email_notification: true
      }
    };

    try {
      const response = await axios.post(
        `${ZOOM_API_BASE}/users/me/meetings`,
        meetingConfig,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        meetingId: response.data.id.toString(),
        meetingNumber: response.data.id.toString(),
        joinUrl: response.data.join_url,
        startUrl: response.data.start_url,
        password: response.data.password || meetingConfig.password,
        hostEmail: response.data.host_email
      };
    } catch (error) {
      console.error('Create Meeting Error:', error.response?.data || error.message);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  // Get meeting participants (for attendance)
  async getMeetingParticipants(meetingId) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${ZOOM_API_BASE}/metrics/meetings/${meetingId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data.participants || [];
    } catch (error) {
      // If meeting hasn't started yet or no participants
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  // Get past meeting details
  async getPastMeetingDetails(meetingId) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${ZOOM_API_BASE}/past_meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Get Past Meeting Error:', error.response?.data || error.message);
      return null;
    }
  }

  // End meeting (for admin)
  async endMeeting(meetingId) {
    const token = await this.getAccessToken();

    try {
      await axios.put(
        `${ZOOM_API_BASE}/meetings/${meetingId}/status`,
        { action: 'end' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('End Meeting Error:', error.response?.data || error.message);
      throw new Error('Failed to end meeting');
    }
  }

  // Helper: Format date and time for Zoom API
  formatDateTime(date, time) {
    const dateObj = new Date(date);
    const [hours, minutes] = time.split(':');
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Return ISO string with timezone
    return dateObj.toISOString();
  }

  // Helper: Generate random password
  generatePassword() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

module.exports = new ZoomService();