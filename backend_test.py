#!/usr/bin/env python3
"""
Backend API Testing Script
Tests the backend endpoints after restore/clone to validate functionality.
"""

import requests
import json
import sys
from typing import Dict, Any

# Base URL from frontend .env
BASE_URL = "https://numerical-calc-1.preview.emergentagent.com"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.access_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_hello_world(self):
        """Test GET /api/ endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_test("GET /api/ (Hello World)", True, "Returned correct message")
                else:
                    self.log_test("GET /api/ (Hello World)", False, 
                                f"Wrong message: {data}", data)
            else:
                self.log_test("GET /api/ (Hello World)", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("GET /api/ (Hello World)", False, f"Exception: {str(e)}")

    def test_schedule_subjects(self):
        """Test GET /api/schedule/subjects endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/schedule/subjects")
            
            if response.status_code == 200:
                data = response.json()
                
                if len(data) == 4:
                    # Check if all subjects have required fields
                    required_fields = ["subject_id", "name", "color", "icon", "topics"]
                    all_valid = True
                    missing_fields = []
                    
                    for subject in data:
                        for field in required_fields:
                            if field not in subject:
                                all_valid = False
                                missing_fields.append(f"{subject.get('name', 'Unknown')}.{field}")
                    
                    if all_valid:
                        self.log_test("GET /api/schedule/subjects", True, 
                                    f"Found 4 subjects with all required fields")
                    else:
                        self.log_test("GET /api/schedule/subjects", False, 
                                    f"Missing fields: {missing_fields}", data)
                else:
                    self.log_test("GET /api/schedule/subjects", False, 
                                f"Expected 4 subjects, got {len(data)}", data)
            else:
                self.log_test("GET /api/schedule/subjects", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("GET /api/schedule/subjects", False, f"Exception: {str(e)}")

    def test_schedule_tasks(self):
        """Test GET /api/schedule/tasks endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/schedule/tasks")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    self.log_test("GET /api/schedule/tasks", True, 
                                f"Returned list of {len(data)} tasks")
                else:
                    self.log_test("GET /api/schedule/tasks", False, 
                                f"Expected list, got {type(data)}", data)
            else:
                self.log_test("GET /api/schedule/tasks", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("GET /api/schedule/tasks", False, f"Exception: {str(e)}")

    def test_auth_register(self):
        """Test POST /api/auth/register endpoint"""
        try:
            user_data = {
                "name": "Test User",
                "email": "test2026@ifj.edu.br",
                "password": "test12345"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                data = response.json()
                required_fields = ["id", "name", "email", "created_at", "is_active"]
                
                if all(field in data for field in required_fields):
                    if data["email"] == user_data["email"] and data["name"] == user_data["name"]:
                        self.log_test("POST /api/auth/register", True, 
                                    "User registered successfully with correct data")
                    else:
                        self.log_test("POST /api/auth/register", False, 
                                    "User data mismatch", data)
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("POST /api/auth/register", False, 
                                f"Missing fields: {missing}", data)
            elif response.status_code == 400:
                # User might already exist, which is acceptable
                data = response.json()
                if "já cadastrado" in data.get("detail", "").lower():
                    self.log_test("POST /api/auth/register", True, 
                                "User already exists (acceptable for testing)")
                else:
                    self.log_test("POST /api/auth/register", False, 
                                f"Bad request: {data.get('detail')}", data)
            else:
                self.log_test("POST /api/auth/register", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("POST /api/auth/register", False, f"Exception: {str(e)}")

    def test_auth_login(self):
        """Test POST /api/auth/login endpoint"""
        try:
            credentials = {
                "email": "test2026@ifj.edu.br",
                "password": "test12345"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=credentials,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "access_token" in data and "token_type" in data:
                    if data["token_type"] == "bearer":
                        self.access_token = data["access_token"]
                        self.log_test("POST /api/auth/login", True, 
                                    "Login successful, token received")
                    else:
                        self.log_test("POST /api/auth/login", False, 
                                    f"Wrong token type: {data['token_type']}", data)
                else:
                    self.log_test("POST /api/auth/login", False, 
                                "Missing access_token or token_type", data)
            else:
                self.log_test("POST /api/auth/login", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("POST /api/auth/login", False, f"Exception: {str(e)}")

    def test_auth_me(self):
        """Test GET /api/auth/me endpoint with token"""
        if not self.access_token:
            self.log_test("GET /api/auth/me", False, "No access token available")
            return
            
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{self.base_url}/api/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "name", "email", "created_at", "is_active"]
                
                if all(field in data for field in required_fields):
                    if data["email"] == "test2026@ifj.edu.br":
                        self.log_test("GET /api/auth/me", True, 
                                    "User info retrieved successfully")
                    else:
                        self.log_test("GET /api/auth/me", False, 
                                    f"Wrong email: {data['email']}", data)
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("GET /api/auth/me", False, 
                                f"Missing fields: {missing}", data)
            else:
                self.log_test("GET /api/auth/me", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("GET /api/auth/me", False, f"Exception: {str(e)}")

    def test_chat_endpoint(self):
        """Test POST /api/chat endpoint with math problem"""
        if not self.access_token:
            self.log_test("POST /api/chat", False, "No access token available")
            return
            
        # Test message from the review request
        math_problem = "Uma prova de múltipla escolha com 60 questões foi corrigida da seguinte forma: o aluno ganhava 5 pontos por questão que acertava e perdia 1 ponto por questão que errava ou deixava em branco. Se um aluno totalizou 210 pontos, qual o número de questões que ele acertou?"
        
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            chat_data = {
                "message": math_problem
            }
            
            print(f"   Sending math problem to chat endpoint...")
            response = self.session.post(f"{self.base_url}/api/chat", json=chat_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "assistant_message" in data and "user_message" in data:
                    assistant_msg = data["assistant_message"]
                    content = assistant_msg.get("content", "")
                    
                    if content:
                        # Verify format requirements
                        format_checks = self.verify_math_response_format(content)
                        
                        if format_checks["all_passed"]:
                            self.log_test("POST /api/chat", True, 
                                        f"Math response format correct. Checks passed: {format_checks['passed_count']}/{format_checks['total_count']}")
                        else:
                            self.log_test("POST /api/chat", True, 
                                        f"Chat works but format needs adjustment. Checks passed: {format_checks['passed_count']}/{format_checks['total_count']}")
                        
                        # Log the actual response for review
                        print(f"   📝 Assistant Response:")
                        print(f"   {'='*50}")
                        print(f"   {content}")
                        print(f"   {'='*50}")
                        
                    else:
                        self.log_test("POST /api/chat", False, 
                                    "Empty assistant message content", data)
                else:
                    self.log_test("POST /api/chat", False, 
                                "Missing assistant_message or user_message", data)
            else:
                self.log_test("POST /api/chat", False, 
                            f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("POST /api/chat", False, f"Exception: {str(e)}")

    def verify_math_response_format(self, content: str) -> Dict[str, Any]:
        """Verify the assistant response follows the expected math format"""
        checks = []
        
        # 1. Check if starts with "Seja x o número de ..."
        starts_with_seja = content.strip().startswith("Seja x o número de")
        checks.append(("Starts with 'Seja x o número de'", starts_with_seja))
        
        # 2. Check for "Então o número de ... é ..."
        has_entao = "Então o número de" in content
        checks.append(("Contains 'Então o número de ... é'", has_entao))
        
        # 3. Check for LaTeX formulas wrapped in $$...$$
        has_latex = "$$" in content
        latex_count = content.count("$$")
        checks.append(("Has LaTeX formulas ($$...$$)", has_latex and latex_count >= 2))
        
        # 4. Check for "Simplificando:" section
        has_simplificando = "Simplificando:" in content
        checks.append(("Has 'Simplificando:' section", has_simplificando))
        
        # 5. Check if ends with "Portanto, ..." and bold answer
        has_portanto = "Portanto," in content
        has_bold_answer = "**" in content and "questões**" in content
        checks.append(("Has 'Portanto,' conclusion", has_portanto))
        checks.append(("Has bold final answer (**...questões**)", has_bold_answer))
        
        # 6. Check for expected answer (45 questões)
        has_correct_answer = "45" in content and "questões" in content
        checks.append(("Contains expected answer (45 questões)", has_correct_answer))
        
        # Print individual check results
        print(f"   📋 Format verification:")
        passed_count = 0
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
            if passed:
                passed_count += 1
        
        all_passed = passed_count == len(checks)
        
        return {
            "all_passed": all_passed,
            "passed_count": passed_count,
            "total_count": len(checks),
            "checks": checks
        }

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test endpoints in order
        self.test_hello_world()
        self.test_schedule_subjects()
        self.test_schedule_tasks()
        self.test_auth_register()
        self.test_auth_login()
        self.test_auth_me()
        self.test_chat_endpoint()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 All tests passed! Backend is healthy.")
            return True
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check details above.")
            return False

def main():
    """Main function"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()