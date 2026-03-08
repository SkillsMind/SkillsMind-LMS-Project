import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ProfileContext = createContext();

export const ProfileProvider = ({ children, userId, token }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const backendURL = "http://localhost:5000";

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    if (!userId || userId === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${backendURL}/api/student-profile/details/${userId}`, axiosConfig);
      
      if (res.data) {
        const data = res.data.profile || res.data;
        const profileData = {
          ...data,
          firstName: data.firstName || data.name?.split(' ')[0] || '',
          lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
          name: data.firstName ? `${data.firstName} ${data.lastName || ''}` : (data.name || ''),
          profileImage: data.profileImage || data.avatar || data.image || null,
          email: data.email || '',
          phone: data.phone || data.mobile || '',
          gender: data.gender || 'male',
          city: data.city || '',
          institute: data.institute || data.education || '',
          education: data.education || '',
          bio: data.bio || ''
        };
        
        setProfile(profileData);
        localStorage.setItem('skillsmind_profile', JSON.stringify(profileData));
        return profileData;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('skillsmind_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        return parsed;
      }
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    try {
      const res = await axios.post(`${backendURL}/api/student-profile/submit`, {
        userId,
        ...updates
      }, axiosConfig);

      if (res.data.success) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        localStorage.setItem('skillsmind_profile', JSON.stringify(updatedProfile));
        
        // Dispatch event for components listening
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { profile: updatedProfile } 
        }));
        
        return { success: true, data: updatedProfile };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }, [userId, token, profile]);

  // Upload image
  const uploadImage = useCallback(async (file) => {
    if (!file || !userId) return { success: false };

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const res = await axios.post(
        `${backendURL}/api/student-profile/upload-image/${userId}`, 
        formData, 
        { headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' }}
      );

      if (res.data.success) {
        const imageUrl = res.data.imageUrl || res.data.profileImage || 
                        (res.data.profile && res.data.profile.profileImage);
        
        if (imageUrl) {
          const updatedProfile = { ...profile, profileImage: imageUrl };
          setProfile(updatedProfile);
          localStorage.setItem('skillsmind_profile', JSON.stringify(updatedProfile));
          
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { profile: updatedProfile } 
          }));
          
          return { success: true, imageUrl };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
  }, [userId, token, profile]);

  // Delete image
  const deleteImage = useCallback(async () => {
    const updatedProfile = { ...profile, profileImage: null, avatar: null };
    delete updatedProfile.profileImage;
    delete updatedProfile.avatar;
    
    setProfile(updatedProfile);
    localStorage.setItem('skillsmind_profile', JSON.stringify(updatedProfile));
    
    window.dispatchEvent(new CustomEvent('profileUpdated', { 
      detail: { profile: updatedProfile } 
    }));
    
    return { success: true };
  }, [profile]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen for external updates
  useEffect(() => {
    const handleExternalUpdate = (e) => {
      if (e.detail?.profile) {
        setProfile(e.detail.profile);
      }
    };
    
    window.addEventListener('profileUpdated', handleExternalUpdate);
    return () => window.removeEventListener('profileUpdated', handleExternalUpdate);
  }, []);

  const value = {
    profile,
    setProfile,
    loading,
    fetchProfile,
    updateProfile,
    uploadImage,
    deleteImage
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};