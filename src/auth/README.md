# Authentication Module with Firebase Authentication

This module handles user authentication using **Firebase** as the primary identity provider. The authentication flow is as follows: the front-end (FE) communicates directly with Firebase to handle sign-in/sign-up and receive an authentication token; then, the FE sends this token to the back-end (BE) for verification and authorization. The FE only stores user data and the token.

> **Note:** JWT is no longer used in this module. Firebase manages token issuance and verification.

---

## Table of Contents
- [Overview](#overview)
- [File-by-File Explanation](#file-by-file-explanation)
  - [auth.controller.ts](#authcontrollerts)
  - [auth.module.ts](#authmodulets)
  - [firebase.service.ts](#firebaseservicets)
  - [firebase-auth.guard.ts](#firebase-auth-guardts)
- [Authentication Flow](#authentication-flow)
- [Testing with Postman](#testing-with-postman)
- [Summary](#summary)

---

## Overview

This authentication module leverages **Firebase** for user management. The flow is as follows:

- **Front-End (FE):**
  - The FE interacts directly with Firebase to perform user sign-in/sign-up.
  - Firebase returns an authentication token along with basic user data (e.g., UID, email, custom claims).
  - The FE stores this token and user data locally.

- **Back-End (BE):**
  - The BE receives the Firebase token via the authentication controller.
  - It verifies the token using the Firebase Admin SDK.
  - Upon successful verification, the BE processes authorization (e.g., role-based access control) and attaches user details to the request.

---

## File-by-File Explanation

### auth.controller.ts
- **Purpose:**  
  Defines the endpoint for token verification.
  
- **Endpoint:**
  - `POST /auth/login`:  
    Accepts a Firebase token from the FE, calls `FirebaseAuthGuard.canActive()` guard to validate the token with Firebase, then calls `UserService.Register()` to continue check if user is created or not, and returns user details and permissions upon successful verification.

### auth.module.ts
- **Purpose:**  
  Configures the authentication module.
  
- **Key Components:**
  - **Imports:**  
    - `UsersModule` for additional user management (if required).
    - Firebase Admin SDK configuration for token verification.
  - **Providers:**  
    Registers `FirebaseService`, and `FirebaseAuthGuard`.
  - **Controllers:**  
    Registers `AuthController`.

### firebase.service.ts
- **Purpose:**  
  Contains the core authentication logic.
  
- **Key Methods:**


### firebase-auth.guard.ts
- **Purpose:**  
  A custom guard that protects routes by verifying the Firebase token.
  
- **Behavior:**  
  Intercepts incoming requests, extracts the Firebase token (typically from the `Authorization` header), and uses verify its validity. If the token is valid, user details are attached to `req.user` for further processing; otherwise, access is denied.

---

## Authentication Flow

1. **User Authentication on FE:**
   - The user signs in or registers using Firebase on the FE.
   - Firebase returns an authentication token along with basic user data (e.g., UID, email, and custom claims).

2. **Token Verification on BE:**
   - The FE sends a request to `POST /auth/verify` with the Firebase token.
   - `FirebaseAuthGuard` extracts the token and delegates its verification to `FirebaseStrategy`.
   - `FirebaseStrategy` calls `AuthService.verifyToken()` to validate the token using the Firebase Admin SDK.
   - Upon successful verification, the user details (and any permissions/roles) are attached to `req.user`.

3. **Authorization:**
   - Protected routes utilize `req.user` for role-based access control and other authorization logic.

---

## Testing with Postman

1. **Verify Token:**
   - **Endpoint:** `POST /auth/login`
   - **Body Example:**
     ```json
     {
       "token": "firebase_auth_token_here"
     }
     ```
   - **Expected Response:**
     ```json
     {
       "message": "Token verified successfully",
       "user": {
         "uid": "firebase_user_uid",
         "email": "user@example.com",
         "role": "User"
       }
     }
     ```
   - **Note:**  
     The BE verifies the token using the Firebase Admin SDK and returns an error if the token is invalid or expired.

2. **Access Protected Endpoint:**
   - After verifying the token, use it in the request headers (e.g., `Authorization: Bearer firebase_auth_token_here`) to access protected routes.
   - Confirm that user details are available in `req.user`.

---

## Summary

- **auth.controller.ts:**  
  Handles the endpoint for verifying Firebase tokens, enabling the FE to authenticate via Firebase while the BE validates and processes authorization.

- **auth.module.ts:**  
  Configures the authentication module and integrates Firebase Admin SDK for token verification.

- **firebase.service.ts:**  
  Implements the core logic for verifying Firebase tokens and handling role-based authorization.

- **firebase-auth.guard.ts:**  
  Protects routes by intercepting requests and verifying the provided Firebase token.


This module leverages Firebase for authentication, ensuring that the FE manages user sign-in/sign-up while the BE focuses on token verification and authorization. Adjust and extend this setup as needed for your project's requirements.
