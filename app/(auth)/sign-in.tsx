import CustomButton from '@/components/CustomButton'
import CustomInput from '@/components/CustomInput'
import { sign_In } from '@/lib/appwrite'
import * as Sentry from '@sentry/react-native'
import { Link, router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'

const signIn = () => {
   const [isSubmitting, setIsSubmitting]=useState(false);
   const [form, setForm] = useState({email: '', password: ''});

   const submit = async()=>{
          if(!form.email || !form.password) return Alert.alert('Error', 'Please enter valid credentials');

          setIsSubmitting(true);
          try {
            await sign_In({
                          email:form.email,
                          password:form.password
                        })
            
            router.replace('/');
          }catch(error:any){
            Alert.alert('Error', error.message || 'Something went wrong');
            Sentry.captureEvent(error);
          }finally{
            setIsSubmitting(false);
          }
        }

  return (
    <View className='gap-10 bg-white rounded-lg p-5 mt-5'>

         <CustomInput 
               placeholder='Enter youe Email'
               value={form.email}
                onChangeText={(text)=>setForm((prev)=>({...prev, email: text}))}
                label='Email'
                keyboardType='email-address'
            />
          <CustomInput 
               placeholder='Enter youe Password'
               value={form.password}
               onChangeText={(text)=>setForm((prev)=>({...prev, password: text}))}
               label='Password'
                secureTextEntry={true}
            />
            <CustomButton
              title='Sign IN' 
              isLoading={isSubmitting}
              onPress={submit}
            />

            <View className='flex justify-center mt-5 flex-row gap-3' >
               <Text className='base-regular text-gray-100'>
                   Don't have an account?
               </Text>
               <Link href="/sign-up" className='base-bold text-primary' >
                  Sign Up
               </Link>
            </View>
    </View>
  )
}

export default signIn