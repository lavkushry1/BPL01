import { Team } from '../models';
import { defaultApiClient } from './api/apiUtils';

export const teamService = {
  /**
   * Get all teams
   */
  async getAllTeams() {
    try {
      const response = await defaultApiClient.get('/teams');
      return response.data.teams;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get team by ID
   */
  async getTeamById(id: string) {
    try {
      const response = await defaultApiClient.get(`/teams/${id}`);
      return response.data.team;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new team
   */
  async createTeam(team: Omit<Team, 'id' | 'created_at'>) {
    try {
      const response = await defaultApiClient.post('/teams', team);
      return response.data.team;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a team
   */
  async updateTeam(id: string, team: Partial<Team>) {
    try {
      const response = await defaultApiClient.patch(`/teams/${id}`, team);
      return response.data.team;
    } catch (error) {
      throw error;
    }
  }
};
