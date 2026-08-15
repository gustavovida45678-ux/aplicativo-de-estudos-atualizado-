#!/usr/bin/env python3
"""
Backend API Testing Script - Emergent LLM Key Verification
Tests the platform's full functionality with Emergent LLM Key
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from frontend .env
BASE_URL = "https://numerical-calc-1.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "test2026@ifj.edu.br"
TEST_PASSWORD = "test12345"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(message):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST: {message}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")

def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
    print(f"{RED}❌ {message}{RESET}")

def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")

def print_info(message):
    print(f"{BLUE}ℹ️  {message}{RESET}")

def test_login():
    """Test 1: Login to get JWT token"""
    print_test("POST /api/auth/login - User Authentication")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            },
            timeout=30
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "token_type" in data:
                print_success(f"Login successful")
                print_info(f"Token Type: {data['token_type']}")
                print_info(f"Access Token: {data['access_token'][:50]}...")
                return data['access_token']
            else:
                print_error("Response missing access_token or token_type")
                print_info(f"Response: {json.dumps(data, indent=2)}")
                return None
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Login test failed: {str(e)}")
        return None

def test_chat_general(token):
    """Test 2: Chat with general (non-math) question"""
    print_test("POST /api/chat - General Question (Non-Math)")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        question = "O que é fotossíntese? Explique de forma simples."
        print_info(f"Question: {question}")
        
        response = requests.post(
            f"{BASE_URL}/chat",
            headers=headers,
            json={"message": question},
            timeout=60
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if "assistant_message" in data and "content" in data["assistant_message"]:
                content = data["assistant_message"]["content"]
                print_success("Chat response received")
                print_info(f"Response length: {len(content)} characters")
                print_info(f"Response preview (first 300 chars):\n{content[:300]}...")
                
                # Check if it's NOT using the math format
                is_math_format = content.startswith("Seja x o número de") or content.startswith("Seja x")
                
                if is_math_format:
                    print_warning("Response uses math format 'Seja x...' for non-math question!")
                    print_error("FAILED: Should be a friendly conceptual answer, not math format")
                    return False
                else:
                    print_success("Response is in friendly conceptual format (not math format)")
                
                # Check if it's a mock response
                if "⚠️" in content and "configurar" in content.lower():
                    print_error("Response appears to be MOCK/FALLBACK (contains warning about API key)")
                    return False
                else:
                    print_success("Response appears to be from Emergent LLM (not mock)")
                
                return True
            else:
                print_error("Response missing assistant_message or content")
                print_info(f"Response: {json.dumps(data, indent=2)}")
                return False
        else:
            print_error(f"Chat failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Chat general test failed: {str(e)}")
        return False

def test_chat_math(token):
    """Test 3: Chat with math exercise"""
    print_test("POST /api/chat - Math Exercise")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        question = "Qual a derivada de f(x) = 3x² + 5x - 2?"
        print_info(f"Question: {question}")
        
        response = requests.post(
            f"{BASE_URL}/chat",
            headers=headers,
            json={"message": question},
            timeout=60
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if "assistant_message" in data and "content" in data["assistant_message"]:
                content = data["assistant_message"]["content"]
                print_success("Chat response received")
                print_info(f"Response length: {len(content)} characters")
                print_info(f"Response preview (first 400 chars):\n{content[:400]}...")
                
                # Check for LaTeX formulas
                has_latex = "$$" in content or "\\(" in content
                if has_latex:
                    print_success("Response contains LaTeX formulas ($$...$$)")
                else:
                    print_warning("Response does not contain LaTeX formulas")
                
                # Check if it's a mock response
                if "⚠️" in content and "configurar" in content.lower():
                    print_error("Response appears to be MOCK/FALLBACK (contains warning about API key)")
                    return False
                else:
                    print_success("Response appears to be from Emergent LLM (not mock)")
                
                return True
            else:
                print_error("Response missing assistant_message or content")
                print_info(f"Response: {json.dumps(data, indent=2)}")
                return False
        else:
            print_error(f"Chat failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Chat math test failed: {str(e)}")
        return False

def test_chat_code(token):
    """Test 4: Chat with code question"""
    print_test("POST /api/chat - Code Question")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        question = "Como reverter uma string em Python?"
        print_info(f"Question: {question}")
        
        response = requests.post(
            f"{BASE_URL}/chat",
            headers=headers,
            json={"message": question},
            timeout=60
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if "assistant_message" in data and "content" in data["assistant_message"]:
                content = data["assistant_message"]["content"]
                print_success("Chat response received")
                print_info(f"Response length: {len(content)} characters")
                print_info(f"Response preview (first 400 chars):\n{content[:400]}...")
                
                # Check for code blocks
                has_code = "```" in content or "[::-1]" in content or "reversed(" in content
                if has_code:
                    print_success("Response contains code examples")
                else:
                    print_warning("Response may not contain code examples")
                
                # Check if it's a mock response
                if "⚠️" in content and "configurar" in content.lower():
                    print_error("Response appears to be MOCK/FALLBACK (contains warning about API key)")
                    return False
                else:
                    print_success("Response appears to be from Emergent LLM (not mock)")
                
                return True
            else:
                print_error("Response missing assistant_message or content")
                print_info(f"Response: {json.dumps(data, indent=2)}")
                return False
        else:
            print_error(f"Chat failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Chat code test failed: {str(e)}")
        return False

def test_math_explain(token):
    """Test 5: Math explain endpoint with form-data"""
    print_test("POST /api/math/explain - Math Problem Explanation (Form-Data)")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        question = "Resolva a equação x² + 5x + 6 = 0 passo a passo"
        print_info(f"Question: {question}")
        
        # Use form-data, not JSON
        response = requests.post(
            f"{BASE_URL}/math/explain",
            headers=headers,
            data={"question": question},  # form-data
            timeout=90
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for required fields
            required_fields = ["title", "steps", "prerequisites", "similar_questions"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print_error(f"Response missing required fields: {missing_fields}")
                print_info(f"Response keys: {list(data.keys())}")
                return False
            
            print_success("Response has all required fields: title, steps, prerequisites, similar_questions")
            
            # Check steps structure
            steps = data.get("steps", [])
            print_info(f"Number of steps: {len(steps)}")
            
            if len(steps) == 0:
                print_error("No steps in response")
                return False
            
            # Check if first step contains mock/fallback indicators
            first_step_content = steps[0].get("content", "") if steps else ""
            
            if "⚠️" in first_step_content and ("configurar" in first_step_content.lower() or "modo de demonstração" in first_step_content.lower()):
                print_error("Response appears to be MOCK/FALLBACK")
                print_info(f"First step content: {first_step_content[:200]}...")
                return False
            
            print_success("Response appears to be from Emergent LLM (not mock)")
            
            # Print summary
            print_info(f"Title: {data.get('title', 'N/A')}")
            print_info(f"Steps: {len(steps)}")
            print_info(f"Prerequisites: {len(data.get('prerequisites', []))}")
            print_info(f"Similar Questions: {len(data.get('similar_questions', []))}")
            
            # Print first step preview
            if steps:
                print_info(f"First step title: {steps[0].get('title', 'N/A')}")
                print_info(f"First step content preview: {first_step_content[:200]}...")
            
            return True
        else:
            print_error(f"Math explain failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Math explain test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}Backend API Testing - Emergent LLM Key Verification{RESET}")
    print(f"{BLUE}Base URL: {BASE_URL}{RESET}")
    print(f"{BLUE}Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    results = {}
    
    # Test 1: Login
    token = test_login()
    results["login"] = token is not None
    
    if not token:
        print_error("\n❌ Cannot proceed without authentication token")
        print_error("All subsequent tests skipped")
        return False
    
    # Test 2: General question
    results["chat_general"] = test_chat_general(token)
    
    # Test 3: Math exercise
    results["chat_math"] = test_chat_math(token)
    
    # Test 4: Code question
    results["chat_code"] = test_chat_code(token)
    
    # Test 5: Math explain
    results["math_explain"] = test_math_explain(token)
    
    # Summary
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, result in results.items():
        status = f"{GREEN}✅ PASSED{RESET}" if result else f"{RED}❌ FAILED{RESET}"
        print(f"{test_name.ljust(20)}: {status}")
    
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"Total: {total} | Passed: {GREEN}{passed}{RESET} | Failed: {RED}{failed}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
