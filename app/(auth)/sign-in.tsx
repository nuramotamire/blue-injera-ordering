import { router } from 'expo-router'
import React from 'react'
import { Button, Text, View } from 'react-native'

const signIn = () => {
  return (
    <View>
      <Text> Sign in</Text>
      <Button title='Sign in' onPress={()=> router.push('/sign-up')} />
    </View>
  )
}

export default signIn