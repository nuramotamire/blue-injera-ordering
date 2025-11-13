import { Redirect, Slot } from 'expo-router';
import React from 'react';

export default function _layout() {
    const isAuthenticated = false; // Replace with your auth logic

    if (!isAuthenticated) return <Redirect href="/sign-in" />;
    
  return <Slot />
  
}