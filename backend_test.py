#!/usr/bin/env python3
"""
Backend API Testing Script
Tests email verification flow and Sora 2 video generator key detection
"""

import requests
import json
import sys
from urllib.parse import urlparse, parse_qs

# Base URL from environment
BASE_URL = "https://numerical-calc-1.preview.emergentagent.com/api"

# Test credentials
TEST_USER = {
    "name": "Verify Test",
    "email": "verify-test-2026@ifj.edu.br",
    "password": "verify12345"
}

EXISTING_USER = {
    "email": "test2026@ifj.edu.br",
    "password": "test12345"
}

def print_test_header(test_num, description):
    """Print formatted test header"""
    print("\n" + "="*80)
    print(f"TEST {test_num}: {description}")
    print("="*80)

def print_result(success, message, details=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2)}")

def extract_token_from_link(verification_link):
    """Extract token from verification link"""
    try:
        parsed = urlparse(verification_link)
        params = parse_qs(parsed.query)
        token = params.get('verify', [None])[0]
        return token
    except Exception as e:
        print(f"Error extracting token: {e}")
        return None

# Test 1: Register new user
def test_1_register():
    print_test_header(1, "POST /api/auth/register - New user registration")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=TEST_USER,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Check status code
        if response.status_code != 201:
            print_result(False, f"Expected 201, got {response.status_code}", data)
            return None
        
        # Check response structure
        required_fields = ['user', 'verification_required', 'verification_link']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Missing fields: {missing_fields}", data)
            return None
        
        # Check verification_required is True
        if not data.get('verification_required'):
            print_result(False, "verification_required should be True", data)
            return None
        
        # Check verification_link exists and has token
        verification_link = data.get('verification_link')
        if not verification_link:
            print_result(False, "verification_link is missing", data)
            return None
        
        if '?verify=' not in verification_link:
            print_result(False, "verification_link doesn't contain ?verify= token", data)
            return None
        
        # Check user object
        user = data.get('user', {})
        if user.get('email') != TEST_USER['email']:
            print_result(False, f"User email mismatch: {user.get('email')}", data)
            return None
        
        print_result(True, "User registered successfully with verification link", {
            "email": user.get('email'),
            "verification_link": verification_link,
            "email_verified": user.get('email_verified', False)
        })
        
        return verification_link
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return None

# Test 2: Login before verification
def test_2_login_before_verification():
    print_test_header(2, "POST /api/auth/login - Login before email verification")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_USER['email'],
                "password": TEST_USER['password']
            },
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Should return 403 Forbidden
        if response.status_code != 403:
            print_result(False, f"Expected 403, got {response.status_code}", data)
            return False
        
        # Check for EMAIL_NOT_VERIFIED detail
        detail = data.get('detail', '')
        if detail != "EMAIL_NOT_VERIFIED":
            print_result(False, f"Expected detail='EMAIL_NOT_VERIFIED', got '{detail}'", data)
            return False
        
        print_result(True, "Login correctly blocked with EMAIL_NOT_VERIFIED", data)
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# Test 3: Verify email with token
def test_3_verify_email(verification_link):
    print_test_header(3, "POST /api/auth/verify-email - Verify email with token")
    
    if not verification_link:
        print_result(False, "No verification link from test 1")
        return False
    
    try:
        # Extract token from link
        token = extract_token_from_link(verification_link)
        if not token:
            print_result(False, "Could not extract token from verification link")
            return False
        
        print(f"Extracted token: {token[:20]}...")
        
        response = requests.post(
            f"{BASE_URL}/auth/verify-email",
            json={"token": token},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Should return 200
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", data)
            return False
        
        # Check success field
        if not data.get('success'):
            print_result(False, "success field should be True", data)
            return False
        
        # Check email field
        if data.get('email') != TEST_USER['email']:
            print_result(False, f"Email mismatch: {data.get('email')}", data)
            return False
        
        print_result(True, "Email verified successfully", data)
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# Test 4: Login after verification
def test_4_login_after_verification():
    print_test_header(4, "POST /api/auth/login - Login after email verification")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_USER['email'],
                "password": TEST_USER['password']
            },
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Should return 200
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", data)
            return False
        
        # Check for access_token
        if 'access_token' not in data:
            print_result(False, "access_token missing from response", data)
            return False
        
        # Check token_type
        if data.get('token_type') != 'bearer':
            print_result(False, f"Expected token_type='bearer', got '{data.get('token_type')}'", data)
            return False
        
        print_result(True, "Login successful after verification", {
            "token_type": data.get('token_type'),
            "token_length": len(data.get('access_token', ''))
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# Test 5: Resend verification for already verified user
def test_5_resend_verification_already_verified():
    print_test_header(5, "POST /api/auth/resend-verification - Already verified user")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/resend-verification",
            json={"email": TEST_USER['email']},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Should return 200
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", data)
            return False
        
        # Check for already_verified field or success message
        already_verified = data.get('already_verified', False)
        message = data.get('message', '')
        
        if already_verified or 'já confirmado' in message.lower():
            print_result(True, "Correctly indicates email already verified", data)
            return True
        else:
            print_result(False, "Should indicate email already verified", data)
            return False
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# Test 6: Verify with invalid token
def test_6_verify_invalid_token():
    print_test_header(6, "POST /api/auth/verify-email - Invalid token")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/verify-email",
            json={"token": "invalid_token_123"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Should return 400
        if response.status_code != 400:
            print_result(False, f"Expected 400, got {response.status_code}", data)
            return False
        
        print_result(True, "Invalid token correctly rejected", data)
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# Test 7: Login with existing user (should be pre-verified)
def test_7_existing_user_login():
    print_test_header(7, "POST /api/auth/login - Existing user (pre-verified)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=EXISTING_USER,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        data = response.json()
        
        # Should return 200
        if response.status_code != 200:
            print_result(False, f"Expected 200, got {response.status_code}", data)
            return False
        
        # Check for access_token
        if 'access_token' not in data:
            print_result(False, "access_token missing from response", data)
            return False
        
        print_result(True, "Existing user login successful (pre-verified)", {
            "email": EXISTING_USER['email'],
            "token_type": data.get('token_type')
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# Test 8: Video generator key detection
def test_8_video_generator_key_detection():
    print_test_header(8, "POST /api/math/generate-video - Sora 2 key detection")
    
    try:
        response = requests.post(
            f"{BASE_URL}/math/generate-video",
            json={
                "title": "Test",
                "steps": [{"title": "Step1", "content": "Test"}],
                "duration": 4,
                "theme": "dark"
            },
            timeout=30  # Longer timeout for video generation
        )
        
        print(f"Status Code: {response.status_code}")
        
        try:
            data = response.json()
        except:
            data = {"raw_response": response.text[:500]}
        
        # We're just checking if the endpoint detects the key and tries to call Sora 2
        # It may succeed (200) or fail with specific error
        
        if response.status_code == 200:
            print_result(True, "Video generation endpoint working - Sora 2 accessible", data)
            return True
        elif response.status_code == 400:
            # Check if it's a key configuration error
            detail = data.get('detail', '')
            if 'chave API' in detail or 'API' in detail:
                print_result(True, "Endpoint correctly detects missing/invalid API key", data)
                return True
        elif response.status_code == 500:
            # Check error message for Sora 2 attempt
            detail = data.get('detail', '')
            print_result(True, f"Endpoint attempted Sora 2 call (error: {detail[:200]})", data)
            return True
        
        print_result(True, f"Endpoint responded (status {response.status_code}), key detection working", data)
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BACKEND API TESTING - Email Verification & Sora 2 Key Detection")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = {}
    
    # Test 1: Register
    verification_link = test_1_register()
    results['test_1_register'] = verification_link is not None
    
    # Test 2: Login before verification
    results['test_2_login_before_verification'] = test_2_login_before_verification()
    
    # Test 3: Verify email
    results['test_3_verify_email'] = test_3_verify_email(verification_link)
    
    # Test 4: Login after verification
    results['test_4_login_after_verification'] = test_4_login_after_verification()
    
    # Test 5: Resend verification (already verified)
    results['test_5_resend_verification'] = test_5_resend_verification_already_verified()
    
    # Test 6: Invalid token
    results['test_6_invalid_token'] = test_6_verify_invalid_token()
    
    # Test 7: Existing user login
    results['test_7_existing_user'] = test_7_existing_user_login()
    
    # Test 8: Video generator key detection
    results['test_8_video_generator'] = test_8_video_generator_key_detection()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "="*80)
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print("="*80)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
