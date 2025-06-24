# User Registration System Documentation

## Overview

The medical clinic management system (SGMM) includes a complete user registration system that allows new users to create accounts independently, without requiring administrator intervention.

## Architecture

### Backend Components

#### 1. Registration Endpoint
- **Route**: `POST /register`
- **Location**: `backend/app/main.py`
- **Purpose**: Create new user accounts with email validation

```python
@app.post("/register", response_model=schemas.UserRead)
def register_user(
    user: schemas.UserCreate,
    session: Session = Depends(get_session)
):
    # Check if user already exists
    existing_user = session.exec(
        select(models.User).where(models.User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    return crud.create_user(session=session, user=user)
```

#### 2. User Creation Function
- **Location**: `backend/app/crud.py`
- **Function**: `create_user()`
- **Features**: Password hashing with bcrypt

```python
def create_user(session: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user."""
    db_user = models.User(
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user
```

#### 3. User Schemas
- **Location**: `backend/app/schemas.py`
- **Schemas**: `UserCreate`, `UserRead`

```python
class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
```

### Frontend Components

#### 1. Registration Page
- **Location**: `src/app/register/page.tsx`
- **Route**: `/register`
- **Features**:
  - Email and password input fields
  - Password confirmation validation
  - Minimum password length requirement (6 characters)
  - Error handling and success messages
  - Automatic redirect to login after successful registration

#### 2. AuthService Extension
- **Location**: `src/lib/auth-service.ts`
- **Method**: `register(email, password)`
- **Features**:
  - RESTful API communication
  - Error handling for duplicate emails
  - JSON request/response handling

```typescript
static async register(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { 
                success: false, 
                message: errorData.detail || "Registration failed" 
            };
        }

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { 
            success: false, 
            message: "Error de conexión. Intente nuevamente." 
        };
    }
}
```

#### 3. useAuth Hook Extension
- **Location**: `src/hooks/use-auth.ts`
- **Method**: `register(email, password)`
- **Integration**: Connected to AuthService for state management

#### 4. AuthProvider Update
- **Location**: `src/components/providers/auth-provider.tsx`
- **Interface**: Extended `AuthContextType` to include register method

#### 5. Middleware Configuration
- **Location**: `src/middleware.ts`
- **Update**: Added `/register` to public paths

```typescript
const publicPaths = ["/login", "/register"];
```

## User Flow

### Registration Process

1. **Access Registration Page**
   - User navigates to `/register` directly or clicks "¿No tienes cuenta? Registrarse" from login page

2. **Form Completion**
   - User enters email address
   - User enters password (minimum 6 characters)
   - User confirms password

3. **Client-Side Validation**
   - Password confirmation match
   - Minimum password length
   - Email format validation

4. **Server-Side Processing**
   - Check for existing email in database
   - Hash password using bcrypt
   - Create new user record
   - Return user data or error message

5. **Post-Registration**
   - Success message displayed
   - Automatic redirect to login page after 2 seconds
   - User can then log in with new credentials

### Navigation Flow

```
Login Page (/login)
    ↓ "¿No tienes cuenta? Registrarse"
Registration Page (/register)
    ↓ Successful registration
Login Page (/login)
    ↓ Login with new credentials
Dashboard (/dashboard)
```

## Security Features

### Password Security
- **Hashing**: bcrypt with salt
- **Minimum Length**: 6 characters
- **Storage**: Only hashed passwords stored in database

### Email Validation
- **Uniqueness**: No duplicate emails allowed
- **Format**: Email format validation on frontend
- **Error Handling**: Clear messages for duplicate emails

### Route Protection
- **Public Access**: `/register` and `/login` are publicly accessible
- **Authenticated Redirect**: Logged-in users redirected away from auth pages
- **Protected Routes**: All other routes require authentication

## Error Handling

### Backend Errors
- **400 Bad Request**: Email already registered
- **422 Unprocessable Entity**: Invalid data format
- **500 Internal Server Error**: Database or server errors

### Frontend Error Messages
- "Las contraseñas no coinciden" - Password mismatch
- "La contraseña debe tener al menos 6 caracteres" - Password too short
- "Email already registered" - Duplicate email
- "Error de conexión. Intente nuevamente." - Network errors

## API Documentation

### Registration Endpoint

```bash
POST /register
Content-Type: application/json

Request Body:
{
    "email": "user@example.com",
    "password": "securepassword"
}

Success Response (200):
{
    "id": 1,
    "email": "user@example.com",
    "is_active": true,
    "is_superuser": false
}

Error Response (400):
{
    "detail": "Email already registered"
}
```

## Testing

### Manual Testing Steps

1. **Navigate to Registration Page**
   ```
   http://localhost:3000/register
   ```

2. **Test Form Validation**
   - Try mismatched passwords
   - Try password less than 6 characters
   - Try invalid email format

3. **Test Successful Registration**
   - Enter valid email and password
   - Verify success message
   - Verify redirect to login

4. **Test Duplicate Email**
   - Try registering with existing email
   - Verify error message

5. **Test Login with New Account**
   - Use newly created credentials
   - Verify successful login and dashboard access

### Automated Testing Considerations

- Unit tests for password hashing
- Integration tests for registration endpoint
- E2E tests for complete registration flow
- Security tests for SQL injection and XSS

## Configuration

### Environment Variables
- `SECRET_KEY`: JWT secret for token generation
- `DATABASE_URL`: Database connection string

### Default Settings
- Password minimum length: 6 characters
- New users are active by default
- New users are not superusers by default

## Future Enhancements

### Potential Improvements
1. **Email Verification**: Send confirmation emails
2. **Password Strength**: More complex password requirements
3. **Rate Limiting**: Prevent spam registrations
4. **CAPTCHA**: Bot protection
5. **User Profiles**: Extended user information
6. **Password Recovery**: Forgot password functionality
7. **OAuth Integration**: Google/Facebook login options

### Security Enhancements
1. **Two-Factor Authentication**: SMS or app-based 2FA
2. **Account Lockout**: After failed login attempts
3. **Password Expiration**: Force periodic password changes
4. **Audit Logging**: Track user registration events

## Troubleshooting

### Common Issues

1. **Middleware Blocking Registration**
   - Ensure `/register` is in `publicPaths` array
   - Check middleware configuration

2. **Password Hashing Errors**
   - Verify bcrypt installation
   - Check password format in requests

3. **Database Connection Issues**
   - Verify database setup
   - Check connection string

4. **Frontend Route Issues**
   - Ensure Next.js routing is properly configured
   - Check for TypeScript errors

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify backend logs for API errors
3. Test registration endpoint directly with curl/Postman
4. Validate database user creation

## Maintenance

### Regular Tasks
- Monitor user registration patterns
- Review security logs
- Update password requirements as needed
- Test registration flow after updates

### Database Maintenance
- Regular user table cleanup if needed
- Index optimization for email lookups
- Backup user data regularly
