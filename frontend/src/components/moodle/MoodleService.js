import axios from 'axios';
import { BACKEND_URL } from '../lib/backendUrl';

const API = `${BACKEND_URL}/api/moodle`;

export const moodleService = {
  async getStatus() {
    const res = await axios.get(`${API}/status`);
    return res.data;
  },

  async getCourses() {
    const res = await axios.get(`${API}/courses`);
    return res.data.courses || [];
  },

  async getActivities(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await axios.get(`${API}/activities?${params}`);
    return res.data.activities || [];
  },

  async getDeadlines(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await axios.get(`${API}/deadlines?${params}`);
    return res.data.deadlines || [];
  },

  async getAnnouncements(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await axios.get(`${API}/announcements?${params}`);
    return res.data.announcements || [];
  },

  async sync() {
    const res = await axios.post(`${API}/sync`);
    return res.data;
  },

  async saveToken(token) {
    const res = await axios.post(`${API}/token`, { token });
    return res.data;
  },

  async removeToken() {
    const res = await axios.delete(`${API}/token`);
    return res.data;
  },

  MOODLE_URL: 'https://moodle.ifg.edu.br/my/',

  openMoodle() {
    window.open(this.MOODLE_URL, '_blank', 'noopener,noreferrer');
  }
};

export default moodleService;