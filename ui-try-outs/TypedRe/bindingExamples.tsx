import React, { useState } from 'react';
import { Re } from './TypedRe';
import { TypedReForm, createBinding, withBinding } from './binding';
import { 
  Button, 
  TextField, 
  Card, 
  ButtonProps, 
  TextFieldProps 
} from './components';

/**
 * Example demonstrating TypedReForm with data binding
 */
export function DataBindingExample() {
  const [submittedData, setSubmittedData] = useState<any>(null);
  
  const initialData = {
    user: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  };
  
  const handleSubmit = (data: any) => {
    setSubmittedData(data);
    alert('Form submitted!');
  };
  
  return (
    <div>
      <h2>User Registration Form</h2>
      
      <TypedReForm
        initialData={initialData}
        onSubmit={handleSubmit}
        renderUiPlan={(data, updateData) => {
          // Create bindings for form fields
          const firstNameBinding = createBinding('user.firstName');
          const lastNameBinding = createBinding('user.lastName');
          const emailBinding = createBinding('user.email');
          const phoneBinding = createBinding('user.phone');
          
          return Re.UiPlan('UserRegistration', '1.0')
            .withMainElementSet(
              Re.Element
                .showContainerComponent(
                  Card,
                  Re.ComponentOptions.forComponent(Card)
                    .withProp('title', 'User Information')
                    .withProp('elevation', 1)
                )
                .containing(
                  Re.Element
                    .showComponent(
                      TextField,
                      withBinding<typeof TextField, string>(
                        TextField,
                        firstNameBinding,
                        data,
                        updateData
                      )
                        .withProp('label', 'First Name')
                        .withProp('placeholder', 'Enter your first name')
                        .withProp('required', true)
                        .withProp('fullWidth', true)
                    )
                    .showComponent(
                      TextField,
                      withBinding<typeof TextField, string>(
                        TextField,
                        lastNameBinding,
                        data,
                        updateData
                      )
                        .withProp('label', 'Last Name')
                        .withProp('placeholder', 'Enter your last name')
                        .withProp('required', true)
                        .withProp('fullWidth', true)
                    )
                    .showComponent(
                      TextField,
                      withBinding<typeof TextField, string>(
                        TextField,
                        emailBinding,
                        data,
                        updateData
                      )
                        .withProp('label', 'Email')
                        .withProp('placeholder', 'Enter your email')
                        .withProp('helperText', 'We will never share your email')
                        .withProp('required', true)
                        .withProp('fullWidth', true)
                    )
                    .showComponent(
                      TextField,
                      withBinding<typeof TextField, string>(
                        TextField,
                        phoneBinding,
                        data,
                        updateData
                      )
                        .withProp('label', 'Phone')
                        .withProp('placeholder', 'Enter your phone number')
                        .withProp('fullWidth', true)
                    )
                    .showComponent(
                      Button,
                      Re.ComponentOptions.forComponent(Button)
                        .withProp('label', 'Register')
                        .withProp('variant', 'primary')
                        // Use HTML button type for form submission
                        .withProp('buttonStyle', 'flashy')
                    )
                )
            )
            .build();
        }}
      >
        {/* Optional additional form elements */}
      </TypedReForm>
      
      {submittedData && (
        <div style={{ marginTop: '20px' }}>
          <h3>Submitted Data:</h3>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/**
 * Example of a more complex form with multiple sections
 */
export function ComplexBindingExample() {
  const initialData = {
    personalInfo: {
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        zipCode: ''
      }
    },
    accountInfo: {
      username: '',
      preferredLanguage: 'en',
      receiveNewsletter: false
    }
  };
  
  return (
    <TypedReForm
      initialData={initialData}
      onSubmit={data => console.log('Form submitted:', data)}
      renderUiPlan={(data, updateData) => {
        // Personal info bindings
        const firstNameBinding = createBinding('personalInfo.firstName');
        const lastNameBinding = createBinding('personalInfo.lastName');
        
        // Contact info bindings
        const emailBinding = createBinding('contactInfo.email');
        const phoneBinding = createBinding('contactInfo.phone');
        const streetBinding = createBinding('contactInfo.address.street');
        const cityBinding = createBinding('contactInfo.address.city');
        
        // Account info bindings
        const usernameBinding = createBinding('accountInfo.username');
        
        return Re.UiPlan('UserProfile', '2.0')
          .withMainElementSet(
            Re.Element
              .showContainerComponent(
                Card,
                Re.ComponentOptions.forComponent(Card)
                  .withProp('title', 'Complete User Profile')
                  .withProp('elevation', 2)
              )
              .containing(
                Re.Element
                  // Personal Information Section
                  .showContainerComponent(
                    Card,
                    Re.ComponentOptions.forComponent(Card)
                      .withProp('title', 'Personal Information')
                      .withProp('variant', 'outlined')
                  )
                  .containing(
                    Re.Element
                      .showComponent(
                        TextField,
                        withBinding(TextField, firstNameBinding, data, updateData)
                          .withProp('label', 'First Name')
                          .withProp('fullWidth', true)
                      )
                      .showComponent(
                        TextField,
                        withBinding(TextField, lastNameBinding, data, updateData)
                          .withProp('label', 'Last Name')
                          .withProp('fullWidth', true)
                      )
                  )
                  
                  // Contact Information Section
                  .showContainerComponent(
                    Card,
                    Re.ComponentOptions.forComponent(Card)
                      .withProp('title', 'Contact Information')
                      .withProp('variant', 'outlined')
                  )
                  .containing(
                    Re.Element
                      .showComponent(
                        TextField,
                        withBinding(TextField, emailBinding, data, updateData)
                          .withProp('label', 'Email')
                          .withProp('fullWidth', true)
                      )
                      .showComponent(
                        TextField,
                        withBinding(TextField, phoneBinding, data, updateData)
                          .withProp('label', 'Phone')
                          .withProp('fullWidth', true)
                      )
                      .showComponent(
                        TextField,
                        withBinding(TextField, streetBinding, data, updateData)
                          .withProp('label', 'Street Address')
                          .withProp('fullWidth', true)
                      )
                      .showComponent(
                        TextField,
                        withBinding(TextField, cityBinding, data, updateData)
                          .withProp('label', 'City')
                          .withProp('fullWidth', true)
                      )
                  )
                  
                  // Account Information Section
                  .showContainerComponent(
                    Card,
                    Re.ComponentOptions.forComponent(Card)
                      .withProp('title', 'Account Information')
                      .withProp('variant', 'outlined')
                  )
                  .containing(
                    Re.Element
                      .showComponent(
                        TextField,
                        withBinding(TextField, usernameBinding, data, updateData)
                          .withProp('label', 'Username')
                          .withProp('fullWidth', true)
                      )
                  )
                  
                  // Submit button
                  .showComponent(
                    Button,
                    Re.ComponentOptions.forComponent(Button)
                      .withProp('label', 'Save Profile')
                      .withProp('variant', 'primary')
                      .withProp('buttonStyle', 'flashy')
                  )
              )
          )
          .build();
      }}
    />
  );
}
