import json

# Load the existing Postman collection
with open('docs/TukioHub_Complete_API.postman_collection.json', 'r') as f:
    collection = json.load(f)

# Find the Authentication folder and add new attendee endpoints
for item in collection['item']:
    if item['name'] == 'Authentication':
        # Add new attendee endpoints
        attendee_endpoints = [
            {
                "name": "Register Attendee",
                "request": {
                    "method": "POST",
                    "header": [],
                    "body": {
                        "mode": "raw",
                        "raw": "{\n    \"email\": \"attendee@example.com\",\n    \"first_name\": \"John\",\n    \"last_name\": \"Doe\",\n    \"phone_number\": \"+254712345678\",\n    \"password\": \"securepassword123\",\n    \"password2\": \"securepassword123\",\n    \"is_subscribed\": true\n}",
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    },
                    "url": {
                        "raw": "{{base_url}}/attendees/register/",
                        "host": ["{{base_url}}"],
                        "path": ["attendees", "register", ""]
                    }
                },
                "response": []
            },
            {
                "name": "Login Attendee",
                "request": {
                    "method": "POST",
                    "header": [],
                    "body": {
                        "mode": "raw",
                        "raw": "{\n    \"email\": \"attendee@example.com\",\n    \"password\": \"securepassword123\"\n}",
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    },
                    "url": {
                        "raw": "{{base_url}}/attendees/login/",
                        "host": ["{{base_url}}"],
                        "path": ["attendees", "login", ""]
                    },
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "var responseJson = pm.response.json();",
                                    "pm.environment.set('access_token', responseJson.access_token);",
                                    "pm.environment.set('refresh_token', responseJson.refresh_token);",
                                    "pm.environment.set('attendee_id', responseJson.attendee.id);"
                                ],
                                "type": "text/javascript"
                            }
                        }
                    ]
                },
                "response": []
            },
            {
                "name": "Logout Attendee",
                "request": {
                    "method": "POST",
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "body": {
                        "mode": "raw",
                        "raw": "{\n    \"refresh_token\": \"{{refresh_token}}\"\n}",
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    },
                    "url": {
                        "raw": "{{base_url}}/attendees/logout/",
                        "host": ["{{base_url}}"],
                        "path": ["attendees", "logout", ""]
                    }
                },
                "response": []
            },
            {
                "name": "Get Attendee Profile",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{base_url}}/attendees/profile/",
                        "host": ["{{base_url}}"],
                        "path": ["attendees", "profile", ""]
                    }
                },
                "response": []
            },
            {
                "name": "Update Attendee Profile",
                "request": {
                    "method": "PUT",
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "body": {
                        "mode": "raw",
                        "raw": "{\n    \"first_name\": \"John Updated\",\n    \"last_name\": \"Doe Updated\",\n    \"phone_number\": \"+254712345678\"\n}",
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    },
                    "url": {
                        "raw": "{{base_url}}/attendees/profile/",
                        "host": ["{{base_url}}"],
                        "path": ["attendees", "profile", ""]
                    }
                },
                "response": []
            }
        ]
        
        # Add the new endpoints to the authentication folder
        item['item'].extend(attendee_endpoints)
        break

# Add wallet endpoints - need to create a new Wallet folder or add to existing one
wallet_folder = {
    "name": "Wallet",
    "item": [
        {
            "name": "Get Wallet Balance",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/attendees/wallet/",
                    "host": ["{{base_url}}"],
                    "path": ["attendees", "wallet", ""]
                }
            },
            "response": []
        },
        {
            "name": "Add Money to Wallet",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"amount\": 500.00,\n    \"description\": \"Wallet top-up\"\n}",
                    "options": {
                        "raw": {
                            "language": "json"
                        }
                    }
                },
                "url": {
                    "raw": "{{base_url}}/attendees/wallet/",
                    "host": ["{{base_url}}"],
                    "path": ["attendees", "wallet", ""]
                }
            },
            "response": []
        }
    ]
}

# Add wallet folder to the collection
collection['item'].append(wallet_folder)

# Add admin attendee management endpoints to the Admin folder
for item in collection['item']:
    if item['name'] == 'Admin':
        admin_attendee_endpoints = [
            {
                "name": "List Attendees",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{base_url}}/admin/attendees/",
                        "host": ["{{base_url}}"],
                        "path": ["admin", "attendees", ""]
                    }
                },
                "response": []
            },
            {
                "name": "Get Attendee Details",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{base_url}}/admin/attendees/{{attendee_id}}/",
                        "host": ["{{base_url}}"],
                        "path": ["admin", "attendees", "{{attendee_id}}", ""]
                    }
                },
                "response": []
            },
            {
                "name": "Update Attendee",
                "request": {
                    "method": "PATCH",
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        }
                    ],
                    "body": {
                        "mode": "raw",
                        "raw": "{\n    \"first_name\": \"Updated Name\",\n    \"is_active\": true\n}",
                        "options": {
                            "raw": {
                                "language": "json"
                            }
                        }
                    },
                    "url": {
                        "raw": "{{base_url}}/admin/attendees/{{attendee_id}}/",
                        "host": ["{{base_url}}"],
                        "path": ["admin", "attendees", "{{attendee_id}}", ""]
                    }
                },
                "response": []
            }
        ]
        
        item['item'].extend(admin_attendee_endpoints)
        break

# Update the booking creation request to include the new fields
for item in collection['item']:
    if item['name'] == 'Bookings':
        for booking_item in item['item']:
            if booking_item['name'] == 'Create Booking':
                # Update the request body to include new fields
                booking_item['request']['body']['raw'] = "{\n    \"event_id\": \"{{event_id}}\",\n    \"attendee_id\": \"{{attendee_id}}\",\n    \"attendee_name\": \"John Doe\",\n    \"attendee_email\": \"john@example.com\",\n    \"attendee_phone\": \"+254712345678\",\n    \"payment_method\": \"WALLET\",\n    \"items\": [\n        {\n            \"ticket_type_id\": \"{{ticket_type_id}}\",\n            \"quantity\": 2\n        }\n    ],\n    \"promo_code\": \"\",\n    \"notes\": \"Booking notes\"\n}"
                break
        break

# Save the updated collection
with open('docs/TukioHub_Complete_API.postman_collection.json', 'w') as f:
    json.dump(collection, f, indent=2)

print("Postman collection updated successfully!")