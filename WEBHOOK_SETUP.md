# Webhook Configuration Guide for Clapy

This guide explains how to set up webhooks for WhatsApp (Twilio) and Messenger (Meta) integrations.

## Environment Variables

Add these to your `.env.local`:

```
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_SECRET=your_webhook_secret

# Meta Messenger
META_VERIFY_TOKEN=your_verify_token
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_page_access_token
META_PAGE_ID=your_page_id
```

## Twilio WhatsApp Setup

### 1. Create Twilio Account
- Go to https://www.twilio.com
- Sign up and get your Account SID and Auth Token
- Enable WhatsApp integration

### 2. Get WhatsApp Phone Number
- In Twilio Console, go to "Explore Products" → "Messaging" → "Try it out"
- Select WhatsApp
- Get your Twilio WhatsApp phone number

### 3. Configure Webhook URL
- In Twilio Console, go to "Messaging" → "Settings"
- Set the webhook URL to:
  ```
  https://yourdomain.com/api/webhook/whatsapp
  ```
- Select HTTP POST for the method

### 4. Test Connection
```bash
curl -X GET "https://yourdomain.com/api/webhook/whatsapp?hub.verify_token=your_webhook_secret&hub.challenge=test123"
```

## Meta Messenger Setup

### 1. Create Meta App
- Go to https://developers.facebook.com
- Create a new app (type: Business)
- Add "Messenger" product

### 2. Get Credentials
- In App Dashboard → Settings → Basic, copy your App ID and App Secret
- Go to Messenger → Settings, get your Page Access Token
- Set your Verify Token (can be any string you choose)

### 3. Configure Webhook
- In Messenger → Settings → Webhooks, click "Add Callback URL"
- Enter:
  - Callback URL: `https://yourdomain.com/api/webhook/messenger`
  - Verify Token: (the token you set in ENV)
- Subscribe to:
  - `messages`
  - `messaging_postbacks`
  - `message_deliveries`
  - `message_reads`

### 4. Connect Page to App
- In Messenger → Settings → Connected Apps
- Select your Facebook Page
- Click "Subscribe"

### 5. Test Connection
```bash
curl -X GET "https://yourdomain.com/api/webhook/messenger?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test123"
```

## Database Setup

The messages table will be automatically created in Supabase with the following schema:

```sql
messages {
  id: UUID (primary key)
  channel: 'whatsapp' | 'messenger' | 'email' | 'instagram'
  external_id: VARCHAR (unique, from provider)
  direction: 'inbound' | 'outbound'
  sender_phone: VARCHAR (for WhatsApp)
  sender_id: VARCHAR (for Messenger/Instagram)
  sender_email: VARCHAR (for email)
  content: TEXT
  subject: VARCHAR (for email)
  agency_id: UUID (foreign key)
  agent_id: UUID (foreign key, optional)
  timestamp: TIMESTAMP
  status: 'received' | 'processed' | 'replied' | 'archived'
  raw_data: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Manual Setup (if not auto-created)
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run the SQL in `lib/supabase/migrations/setup-messages-table.sql`

## API Endpoints

### Receive Messages
- **WhatsApp**: `POST /api/webhook/whatsapp`
- **Messenger**: `POST /api/webhook/messenger`

### Send Messages
Use the `sendMessage()` function from `lib/messages/send-message.ts`:

```typescript
import { sendMessage } from "@/lib/messages/send-message";

const result = await sendMessage(supabase, {
  channel: "whatsapp",
  recipientPhone: "+1234567890",
  content: "Hello from Clapy!",
  agencyId: agency.id,
  agentId: agent.id
});
```

### Get Unprocessed Messages
```typescript
import { getUnprocessedMessages } from "@/lib/messages/store-message";

const messages = await getUnprocessedMessages(supabase, agencyId);
```

## Webhook Security

### Twilio
- Uses webhook secret for verification
- Validates token in GET requests

### Meta
- Validates HMAC signature in POST requests
- Uses `x-hub-signature-256` header
- Algorithm: SHA256

## Monitoring

Monitor webhook delivery:
- **Twilio**: Twilio Console → Phone Numbers → WhatsApp Senders → Logs
- **Meta**: App Dashboard → Webhooks → Live Event Data

## Troubleshooting

### Webhook not receiving messages
1. Check environment variables are set
2. Verify webhook URL is publicly accessible
3. Check firewall/security group allows HTTPS
4. Test with curl commands above
5. Check provider's webhook delivery logs

### Messages not storing in database
1. Verify Supabase connection
2. Check messages table exists (run migration)
3. Verify agency_id exists in database
4. Check database logs for errors

### Signature validation failures
1. Ensure META_APP_SECRET is correct
2. Verify raw request body hasn't been modified
3. Check webhook is using correct HTTP method (POST)

## Production Checklist

- [ ] Set up error monitoring/logging (e.g., Sentry)
- [ ] Configure rate limiting for webhooks
- [ ] Set up backup phone numbers for WhatsApp
- [ ] Test failover scenarios
- [ ] Monitor message delivery latency
- [ ] Set up alerts for webhook failures
- [ ] Configure retry logic for failed message sends
- [ ] Implement message deduplication (external_id index)
