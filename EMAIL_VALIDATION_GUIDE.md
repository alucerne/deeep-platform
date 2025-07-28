# Email Validation Platform - User Guide

## Overview

The Email Validation Platform now supports **two different email validation services**:

1. **DEEEP Validation** - Original service with comprehensive email validation
2. **InstantEmail** - New service with fast processing and competitive pricing *(Currently in demo mode with simulated responses)*

## How to Choose Your Validation Service

### Step 1: Navigate to Email Validation
1. Log into your account at `app.deeepverify.com`
2. Click on **"Email Validation"** in the sidebar (previously called "Bulk Upload")

### Step 2: Select Your Service
You'll see a tabbed interface with two options:

#### 🔵 DEEEP Validation Tab
- **Icon:** Mail icon
- **Description:** "Upload CSV files for DEEEP email validation. Requires DEEEP API key and credits."
- **Best for:** Users who already have DEEEP API keys and credits
- **Features:** 
  - Comprehensive email validation
  - Detailed results with multiple validation checks
  - Established service with proven reliability

#### ⚡ InstantEmail Tab  
- **Icon:** Zap/lightning icon
- **Description:** "Upload CSV files for InstantEmail validation. Requires InstantEmail API key and credits."
- **Best for:** New users or those looking for faster processing
- **Features:**
  - Fast processing times
  - Competitive pricing
  - Modern API with webhook support
  - **Demo Mode:** Currently simulates API responses for testing
  - **Real-time Status Updates:** Automatic status checking and download options

### Step 3: Upload Your CSV File
1. **Click on your preferred service tab**
2. **Select your API key** from the dropdown (InstantEmail) or enter manually (DEEEP)
3. **Upload a CSV file** containing email addresses
4. **Review the email preview** to ensure correct parsing
5. **Submit the batch** for processing
6. **Monitor progress** and download results when complete

## API Key Management

### 🔑 Generating API Keys

#### Step 1: Navigate to Generate API Keys
1. Click on **"Generate API Keys"** in the sidebar
2. You'll see a tabbed interface with two options

#### Step 2: Choose Your Service

##### 🔵 DEEEP API Key Tab
- **Icon:** Mail icon
- **Description:** "Create a new DEEEP API key for email validation. This will create an account with DEEEP and provide you with an API key and customer link."
- **Process:**
  1. Enter your email address
  2. Click "Generate API Key"
  3. Receive your DEEEP API key and customer link
  4. Use the customer link to purchase credits

##### ⚡ InstantEmail API Key Tab
- **Icon:** Zap icon  
- **Description:** "Create a new InstantEmail API key for fast email validation. This will create an account with InstantEmail and provide you with an API key."
- **Process:**
  1. Enter your email address
  2. Click "Generate InstantEmail API Key"
  3. Receive your InstantEmail API key
  4. Purchase credits through the "Purchase Credits" page

### 📋 API Key Comparison

| Feature | DEEEP API Key | InstantEmail API Key |
|---------|---------------|---------------------|
| **Generation Location** | "Generate API Keys" page | "Generate API Keys" page |
| **Format** | Alphanumeric (e.g., `q7914jz23danqy8s009pvxpxh9bphpug`) | `user_<UUID>` (e.g., `user_12345678-1234-1234-1234-123456789abc`) |
| **Credits** | Purchased through customer link | Purchased through "Purchase Credits" page |
| **Usage** | DEEEP Validation tab | InstantEmail tab |
| **Selection Method** | Manual input | Dropdown selection |
| **Management** | "API Keys" section | "API Keys" section |

### 🔄 Do You Need Both API Keys?

**Short Answer: No, you can choose one or both.**

#### Option 1: Use Only DEEEP
- Generate only a DEEEP API key
- Use only the DEEEP Validation tab
- Purchase credits through DEEEP customer link

#### Option 2: Use Only InstantEmail  
- Generate only an InstantEmail API key
- Use only the InstantEmail tab
- Purchase credits through "Purchase Credits" page

#### Option 3: Use Both Services
- Generate both API keys
- Compare performance and pricing
- Use whichever service best fits your needs
- Both services can be used simultaneously

## 📋 API Keys Management

### 🔍 Viewing Your API Keys

#### Step 1: Navigate to API Keys
1. Click on **"API Keys"** in the sidebar
2. You'll see a comprehensive view of all your API keys

#### Step 2: Service-Specific Sections

##### 🔵 DEEEP Validation API Keys Section
- **Icon:** Mail icon (blue)
- **Header:** "DEEEP Validation API Keys"
- **Badge:** Shows count of DEEEP keys
- **Information Displayed:**
  - Email address associated with the key
  - Creation date
  - Masked API key with copy button
  - Customer link (if available) with external link icon
  - Current credit balance
  - "Add Credits" button

##### ⚡ InstantEmail API Keys Section
- **Icon:** Zap icon (yellow)
- **Header:** "InstantEmail API Keys"
- **Badge:** Shows count of InstantEmail keys
- **Information Displayed:**
  - Email address associated with the key
  - Creation date
  - Masked API key with copy button
  - Current credit balance
  - "Buy Credits" button

#### Step 3: Key Management Features

##### 🔧 Copy Functionality
- **API Key Copy:** Click the copy icon next to any API key
- **Customer Link Copy:** Click the copy icon next to DEEEP customer links
- **Visual Feedback:** Copy buttons with icons for better UX

##### 💳 Credit Management
- **DEEEP Credits:** "Add Credits" button links to DEEEP customer portal
- **InstantEmail Credits:** "Buy Credits" button links to purchase page
- **Real-time Display:** Current credit balances shown for all keys

##### ➕ Generate New Keys
- **Bottom Section:** "Need more API keys?" with quick action buttons
- **DEEEP Key Button:** Generate new DEEEP API key
- **InstantEmail Key Button:** Generate new InstantEmail API key

### 🎨 Visual Design

#### Service Differentiation
- **Color Coding:** Blue for DEEEP, Yellow for InstantEmail
- **Icons:** Mail icon for DEEEP, Zap icon for InstantEmail
- **Badges:** Service-specific colors and counts
- **Layout:** Separate sections for clear organization

#### User Experience
- **Hover Effects:** Cards highlight on hover
- **Responsive Design:** Works on desktop and mobile
- **Loading States:** Spinner while fetching API keys
- **Empty States:** Helpful messages when no keys exist

## 💳 Credit Management

### 🔑 Purchasing Credits

#### Step 1: Navigate to Purchase Credits
1. Click on **"Purchase Credits"** in the sidebar (previously called "Buy Credits")
2. You'll see a tabbed interface with two options

#### Step 2: Choose Your Service

##### 🔵 DEEEP Credits Tab
- **Icon:** Mail icon
- **Description:** "Buy credits for DEEEP email validation. Credits are used for comprehensive email validation with detailed results."
- **Process:**
  1. Select your DEEEP API key
  2. Choose credit amount
  3. Enter payment information
  4. Complete purchase through NMI payment processor
- **Pricing:** Standard DEEEP pricing

##### ⚡ InstantEmail Credits Tab
- **Icon:** Zap icon
- **Description:** "Buy credits for InstantEmail validation. Credits are used for fast email validation with competitive pricing."
- **Process:**
  1. Choose from pre-defined packages or custom amount
  2. Submit purchase request
  3. Team processes payment and adds credits within 24 hours
- **Pricing:** Competitive pricing with three tiers:
  - **Starter:** 1,000 credits for $9.99 ($9.99 per 1,000)
  - **Professional:** 10,000 credits for $79.99 ($8.00 per 1,000) ⭐ Most Popular
  - **Enterprise:** 100,000 credits for $699.99 ($7.00 per 1,000)

### 📊 Credit Comparison

| Feature | DEEEP Credits | InstantEmail Credits |
|---------|---------------|---------------------|
| **Purchase Location** | Customer link from API key generation | "Purchase Credits" page |
| **Payment Processing** | Immediate through NMI | Manual processing (24 hours) |
| **Pricing** | Standard DEEEP rates | Competitive tiered pricing |
| **Management** | Automatic deduction | Automatic deduction |
| **Refunds** | Through DEEEP support | Through platform support |

### 💰 Pricing Comparison

#### DEEEP Pricing
- Standard DEEEP rates apply
- Purchased through DEEEP customer link
- Immediate payment processing

#### InstantEmail Pricing
- **Starter Package:** $9.99 for 1,000 credits ($9.99 per 1,000)
- **Professional Package:** $79.99 for 10,000 credits ($8.00 per 1,000)
- **Enterprise Package:** $699.99 for 100,000 credits ($7.00 per 1,000)
- **Custom Packages:** Available upon request
- **Bulk Discounts:** Available for large orders

### 🔄 Credit Usage

#### DEEEP Credits
- **Purchase:** Use the customer link provided when generating your API key
- **Check Balance:** Available in the "API Keys" section
- **Deduction:** Automatic when submitting batches

#### InstantEmail Credits
- **Purchase:** Use the "Purchase Credits" page
- **Check Balance:** Available in the "API Keys" section
- **Deduction:** Automatic when submitting batches

## Upload Process

### 🔵 DEEEP Validation Process
1. **Select DEEEP tab** in Email Validation
2. **Enter your DEEEP API key** manually
3. **Upload CSV file** with email addresses
4. **Review parsed emails** and statistics
5. **Submit batch** for processing
6. **Wait for completion** (1-15 minutes depending on batch size)
7. **Download results** when ready

### ⚡ InstantEmail Process
1. **Select InstantEmail tab** in Email Validation
2. **Choose your API key** from the dropdown menu
3. **View available credits** for the selected key
4. **Upload CSV file** with email addresses
5. **Review parsed emails** and credit check
6. **Submit batch** for processing (if sufficient credits)
7. **Monitor progress** with automatic status checking
8. **Download results** when batch completes *(Demo: 5-second simulation)*

### 🔑 API Key Selection Differences

#### DEEEP API Key Selection
- **Method:** Manual input field
- **Validation:** Real-time validation against DEEEP API
- **Error Handling:** Shows validation errors if key is invalid
- **Persistence:** Stored in browser for convenience

#### InstantEmail API Key Selection
- **Method:** Dropdown menu with all available keys
- **Display:** Shows masked API keys (e.g., `user_1234...abcd`)
- **Credits:** Shows available credits for each key
- **Validation:** Automatic validation when key is selected
- **Error Handling:** Shows warning if no keys available

## Results and Downloads

### 📊 Batch Status Monitoring

#### InstantEmail Status Tracking
- **Automatic Checking:** Status is automatically checked after submission
- **Real-time Updates:** Progress indicators show current status
- **Status Types:**
  - **Processing:** Batch is being validated
  - **Complete:** Results ready for download
  - **Failed:** Error occurred during processing

#### Status Display
- **Progress Bar:** Shows upload, processing, and status checking phases
- **Status Badge:** Color-coded status indicators (green=complete, yellow=processing, red=failed)
- **Results Count:** Shows number of emails processed
- **Summary Statistics:** Valid vs invalid email counts

### 📥 Download Options

#### InstantEmail Results Download
- **Automatic Detection:** Download button appears when batch completes
- **CSV Format:** Results downloaded as CSV file
- **File Naming:** Automatic filename with request ID
- **Content:** Email addresses with validation results (last_seen dates)

#### Download Process
1. **Batch Completion:** Status changes to "Complete"
2. **Download Button:** Green "Download CSV" button appears
3. **File Information:** Shows filename and size
4. **One-Click Download:** Click to download results immediately

#### CSV File Contents
```csv
email,last_seen
valid@example.com,2025-07-02T07:36:28.942+00:00
invalid@example.com,
```

- **Valid Emails:** Have a `last_seen` timestamp
- **Invalid Emails:** Empty `last_seen` field
- **Headers:** CSV includes column headers for easy processing

### 🔄 Manual Status Checking

#### Check Status Button
- **When Available:** During processing phase
- **Function:** Manually check batch status
- **Visual Feedback:** Spinning icon during check
- **Auto-refresh:** Automatically checks again if still processing

#### Status Check Flow
1. **Submit Batch:** Initial submission
2. **Automatic Check:** 6 seconds after submission
3. **Manual Check:** Available during processing
4. **Auto-refresh:** Every 10 seconds if still processing
5. **Complete:** Download option appears

## Upload History

The **"Upload History"** section at the bottom of the page shows:
- **All your uploads** from both services
- **Processing status** (processing, complete, failed)
- **Download links** for completed batches
- **Credit usage** for each batch

## Service Comparison

| Feature | DEEEP Validation | InstantEmail |
|---------|------------------|--------------|
| **Processing Speed** | Standard | Fast |
| **Pricing** | Standard DEEEP rates | Competitive tiered pricing |
| **API Integration** | REST API | REST API + Webhooks |
| **Result Format** | CSV download | CSV download + JSON |
| **Credit System** | DEEEP credits | InstantEmail credits |
| **API Key Format** | Alphanumeric | `user_<UUID>` |
| **API Key Selection** | Manual input | Dropdown menu |
| **Payment Processing** | Immediate | 24-hour manual processing |
| **Status Tracking** | Manual checking | Automatic + manual |
| **Download Options** | Manual download | Automatic detection |
| **API Key Management** | "API Keys" section | "API Keys" section |
| **Current Status** | Production | Demo Mode |

## Demo Mode Information

### ⚡ InstantEmail Demo Features
- **Simulated API Responses:** All API calls are simulated for demonstration purposes
- **Real Credit System:** Credits are actually deducted and managed
- **Simulated Processing:** Batches complete after 5 seconds with realistic results
- **Webhook Simulation:** Automatic webhook calls simulate real-time updates
- **Real Database Storage:** All data is stored in the actual database
- **Production-Ready Code:** Same codebase will work with real InstantEmail API
- **Real Download Functionality:** CSV files are generated and downloadable

### 🎯 Demo vs Production
| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| **API Calls** | Simulated responses | Real InstantEmail API |
| **Processing Time** | 5 seconds | Variable (1-15 minutes) |
| **Results** | Simulated (85% valid) | Real validation results |
| **Webhooks** | Simulated | Real webhook notifications |
| **Credits** | Real deduction | Real deduction |
| **Database** | Real storage | Real storage |
| **Downloads** | Real CSV generation | Real CSV generation |

## Getting Started

### For New Users:
1. **Choose InstantEmail** for faster setup and competitive pricing
2. Generate an InstantEmail API key
3. Purchase credits through "Purchase Credits" page
4. Start uploading CSV files

### For Existing DEEEP Users:
1. **Continue using DEEEP** with your existing API keys
2. Or **try InstantEmail** for comparison and potentially better pricing
3. Both services can be used simultaneously

## Support

- **DEEEP Issues:** Contact DEEEP support
- **InstantEmail Issues:** Contact platform support
- **Platform Issues:** Contact platform support
- **Credit Purchases:** Contact platform support

## Tips

- **Test with small batches** first (10-50 emails)
- **Check your credit balance** before large uploads
- **Use the preview feature** to verify email parsing
- **Download results promptly** as links may expire
- **Keep your API keys secure** and don't share them
- **Compare pricing** between services for your volume needs
- **InstantEmail credits** are processed manually - plan ahead for large purchases
- **InstantEmail API keys** are automatically loaded in the dropdown - no need to remember them
- **Demo Mode:** InstantEmail currently simulates responses for testing purposes
- **Status Monitoring:** Use the automatic status checking for real-time updates
- **Download Results:** Results are automatically available for download when processing completes
- **API Key Management:** View all your keys in the "API Keys" section with service-specific organization
- **Copy Functionality:** Use the copy buttons to easily copy API keys and customer links

---

*Both services provide high-quality email validation. Choose based on your specific needs, pricing preferences, and processing speed requirements.* 