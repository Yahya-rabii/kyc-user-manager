import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppLogicService {

  constructor() {}

  async getRealms(): Promise<string[]> {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const getRealmsUrl = `${environment.AuthapiUrl}${environment.GetRealmsEndpoint}`;
    try {
      const response = await fetch(getRealmsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data || [];
      } else {
        console.error('Error fetching realms:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching realms:', error);
      throw error;
    }
  }

  async getUsersInRealm(realm: string): Promise<any[]> {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const getUsersUrl = `${environment.AuthapiUrl}/realms/${realm}/users`;
    try {
      const response = await fetch(getUsersUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data || [];
      } else {
        console.error('Error fetching users:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserRoles(realm: string, userId: string): Promise<any[]> {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const getUserRolesUrl = `${environment.AuthapiUrl}/realms/${realm}/users/${userId}/roles`;
    try {
      const response = await fetch(getUserRolesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data || [];
      } else {
        console.error('Error fetching user roles:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  }

  async getAvailableRoles(realm: string): Promise<any[]> {
  const accessToken = sessionStorage.getItem('access_token');
  const url = `${environment.AuthapiUrl}/realms/${realm}/available-roles`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch roles');
  return res.json();
  }

  async setUserRoles(realm: string, userId: string, roles: any[]): Promise<void> {
  const accessToken = sessionStorage.getItem('access_token');
  const url = `${environment.AuthapiUrl}/realms/${realm}/users/${userId}/roles/full-sync`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(roles),
  });
  if (!res.ok) throw new Error('Failed to set user roles');
  }



 async removeRolesFromUser(realm: string, userId: string, roles: any[]): Promise<void> {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const removeRolesUrl = `${environment.AuthapiUrl}/realms/${realm}/users/${userId}/roles`;
    try {
      const response = await fetch(removeRolesUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roles),
      });
      if (!response.ok) {
        console.error('Error removing roles:', response.statusText);
        throw new Error('Failed to remove roles');
      }
    } catch (error) {
      console.error('Error removing roles:', error);
      throw error;
    }
  }

  async addRolesToUser(realm: string, userId: string, roles: any[]): Promise<void> {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const addRolesUrl = `${environment.AuthapiUrl}/realms/${realm}/users/${userId}/roles`;
    try {
      const response = await fetch(addRolesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roles),
      });
      if (!response.ok) {
        console.error('Error adding roles:', response.statusText);
        throw new Error('Failed to add roles');
      }
    } catch (error) {
      console.error('Error adding roles:', error);
      throw error;
    }
  }

  async updateUserRoles (realm: string, userId: string, roles: any[]): Promise<void> {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found in session storage');
    }
    const updateRolesUrl = `${environment.AuthapiUrl}/realms/${realm}/users/${userId}/roles`;
    try {
      const response = await fetch(updateRolesUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(roles),
      });
      if (!response.ok) {
        console.error('Error updating roles:', response.statusText);
        throw new Error('Failed to update roles');
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      throw error;
    }
  }

  

}
