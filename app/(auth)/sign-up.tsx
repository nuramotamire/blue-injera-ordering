import CustomButton from '@/components/CustomButton'
import CustomInput from '@/components/CustomInput'
import { createUser } from '@/lib/appwrite'
import { Link, router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'

const signUp = () => {

   const [isSubmitting, setIsSubmitting]=useState(false);
   const [form, setForm] = useState({name :'',email: '', password: ''});

   const submit = async()=>{
          if(!form.name || !form.email || !form.password) return Alert.alert('Error', 'Please enter valid credentials');

          setIsSubmitting(true);
          try {
            await createUser({
                email:form.email,
                name:form.name,
                password:form.password
            })
           
            router.replace('/');
          }catch(error:any){
            Alert.alert('Error', error.message || 'Something went wrong');
          }finally{
            setIsSubmitting(false);
          }
        }

  return (
    <View className='gap-10 bg-white rounded-lg p-5 mt-5'>

         <CustomInput 
               placeholder='Enter youe Name'
               value={form.name}
                onChangeText={(text)=>setForm((prev)=>({...prev, name: text}))}
                label='Name'
                keyboardType='email-address'
            />

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
              title='Sign UP' 
              isLoading={isSubmitting}
              onPress={submit}
            />

            <View className='flex justify-center mt-5 flex-row gap-3' >
               <Text className='base-regular text-gray-100'>
                   Aleady have an account?
               </Text>
               <Link href="/sign-in" className='base-bold text-primary' >
                  Sign In
               </Link>
            </View>
    </View>
  )
}

export default signUp