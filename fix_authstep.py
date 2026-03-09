import re
import sys

file_path = sys.argv[1] if len(sys.argv) > 1 else 'src/components/auth/AuthStep.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove phoneNumber from signUp data object
old_signup = r'await signUp\.email\(\{\s+email,\s+password,\s+name,\s+callbackURL: "[^"]*",\s+data: \{\s+phoneNumber: phoneNumber\.trim\(\),\s+\},\s+\}\);'
new_signup = '''await signUp.email({
            email,
            password,
            name,
            callbackURL: "/idopontfoglalas",
          });

          // Save phoneNumber separately (Better Auth doesn't support custom fields)
          if (result?.user?.id && phoneNumber.trim()) {
            try {
              await fetch('/api/user/phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
              });
            } catch (err) {
              console.error('[AuthStep] Phone save failed:', err);
            }
          }'''

content = re.sub(old_signup, new_signup, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'[OK] Fixed {file_path}')
