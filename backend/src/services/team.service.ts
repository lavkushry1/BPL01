import { Team } from '../models';
import { defaultApiClient } from './api/apiUtils';

export const teamService = {
  /**
   * Get all teams
   */
  async getAllTeams() {
      const response = await defaultApiClient.get('/teams');
    return response.data.teams;
  },

  /**
   * Get team by ID
   */
  async getTeamById(id: string) {
      const response = await defaultApiClient.get(`/teams/${id}`);
    return response.data.team;
  },

  /**
   * Create a new team
   */
  async createTeam(team: Omit<Team, 'id' | 'created_at'>) {
      const response = await defaultApiClient.post('/teams', team);
    return response.data.team;
  },

  /**
   * Update a team
   */
  async updateTeam(id: string, team: Partial<Team>) {
      const response = await defaultApiClient.patch(`/teams/${id}`, team);
    return response.data.team;
  }
};
