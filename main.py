import os
from openai import OpenAI

# The API key is automatically read from the Replit Secret named OPENAI_API_KEY
client = OpenAI() 

# The code you want to audit
code_to_audit = """
def vulnerable_function(user_input):
    # This is a potential command injection vulnerability
    os.system(f"echo {user_input}")

print("Running a potentially unsafe function.")
vulnerable_function("hello world")
"""

print("--- Sending code to ChatGPT for auditing... ---")

# This is the prompt that tells the AI what to do
response = client.chat.completions.create(
  model="gpt-4o",  # Or "gpt-3.5-turbo"
  messages=[
    {
      "role": "system",
      "content": "You are a senior cybersecurity expert. Your task is to audit the following Python code for any security vulnerabilities. Provide a clear and concise report."
    },
    {
      "role": "user",
      "content": code_to_audit
    }
  ]
)

audit_result = response.choices[0].message.content
print("\n--- Audit Report from ChatGPT ---")
print(audit_result)