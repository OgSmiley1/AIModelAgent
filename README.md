# Manus AI Model Agent - Luxury Watch Sales Intelligence Platform

🤖 **AI-Powered Sales Analysis for Vacheron Constantin**

## 🚀 Overview

The Manus AI Model Agent is a sophisticated web application that integrates with Manus AI to provide intelligent analysis of luxury watch sales data. Upload your client Excel files and receive enhanced reports with AI-driven insights, client prioritization, and actionable follow-up recommendations.

## ✨ Features

### 🧠 AI-Powered Analysis
- **Portfolio Analysis**: Automatic calculation of client portfolio values
- **Client Prioritization**: Smart ranking based on value and engagement
- **Tier Classification**: VIP, Premium, and Standard client categorization
- **Follow-up Planning**: Actionable next steps for each client

### 📊 Enhanced Reporting
- **Excel Integration**: Upload and download Excel files seamlessly
- **Multi-Sheet Output**: Analysis results with executive summary
- **Visual Dashboard**: Beautiful web interface with real-time stats
- **Mobile Responsive**: Works perfectly on all devices

### 🎯 Sales Intelligence
- **Watch Recommendations**: Personalized Vacheron Constantin model suggestions
- **Contact Strategy**: Optimal communication methods and timing
- **Value Estimation**: Predictive client lifetime value analysis
- **Sentiment Analysis**: Client engagement level assessment

## 🛠️ Installation & Setup

### For Replit (Recommended)

1. **Create New Repl**:
   - Go to [Replit](https://replit.com)
   - Click "Create Repl"
   - Choose "Python" template
   - Name it "AIModelAgent"

2. **Upload Files**:
   - Copy all files from this package to your Repl
   - Ensure the folder structure matches:
   ```
   /
   ├── main.py
   ├── requirements.txt
   ├── README.md
   ├── templates/
   │   ├── index.html
   │   └── results.html
   └── uploads/
   ```

3. **Set Environment Variables**:
   - Click the "Secrets" tab (🔒 icon)
   - Add new secret:
     - Key: `MANUS_API_KEY`
     - Value: Your actual Manus API key (e.g., `manus_sk_...`)

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the Application**:
   - Click the "Run" button
   - Your app will be available at the provided URL

### For Local Development

1. **Clone/Download**:
   ```bash
   git clone <repository-url>
   cd AIModelAgent
   ```

2. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Environment Variable**:
   ```bash
   export MANUS_API_KEY="your_manus_api_key_here"
   ```

5. **Run Application**:
   ```bash
   python main.py
   ```

6. **Access Application**:
   - Open browser to `http://localhost:5000`

## 📋 Usage Guide

### 1. Upload Client Data
- Navigate to the main page
- Click "Choose File" or drag & drop your Excel file
- Supported formats: `.xlsx`, `.xls`
- Maximum file size: 16MB

### 2. AI Analysis Process
- Click "Analyze with Manus AI"
- The system will:
  - Upload your file to Manus AI
  - Perform intelligent analysis
  - Generate enhanced report
  - Create downloadable Excel file

### 3. Download Results
- View analysis summary on results page
- Download enhanced Excel file with:
  - Original data preserved
  - New analysis columns added
  - Executive summary sheet
  - Actionable insights

## 📊 Output Columns

The enhanced Excel file includes these new columns:

| Column | Description |
|--------|-------------|
| `Priority` | High/Medium/Low based on portfolio value |
| `Client_Tier` | VIP/Premium/Standard classification |
| `Last_Instructions` | Previous interaction summary |
| `Next_Action` | Specific recommended follow-up |
| `Estimated_Value` | Predicted client lifetime value |
| `Recommended_Models` | Suggested Vacheron Constantin watches |
| `Contact_Method` | Optimal communication channel |
| `Follow_Up_Date` | Recommended next contact date |
| `Sentiment_Score` | Client engagement assessment |
| `Engagement_Level` | Overall relationship strength |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MANUS_API_KEY` | Your Manus AI API key | Yes |
| `FLASK_ENV` | Development/Production mode | No |
| `FLASK_DEBUG` | Enable debug mode | No |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main upload interface |
| `/analyze` | POST | File upload and analysis |
| `/results/<filename>` | GET | Analysis results page |
| `/download/<filename>` | GET | Download processed file |
| `/api/status` | GET | System status check |
| `/health` | GET | Health check endpoint |

## 🎨 Customization

### Styling
- Edit `templates/index.html` and `templates/results.html`
- Modify CSS variables for colors and fonts
- Add custom branding and logos

### Analysis Logic
- Modify `analyze_with_manus()` function in `main.py`
- Customize priority rules and tier thresholds
- Add new analysis columns as needed

### UI Features
- Add new pages by creating templates
- Extend Flask routes for additional functionality
- Integrate with other APIs or databases

## 🔒 Security Features

- **File Validation**: Only Excel files accepted
- **Secure Uploads**: Files sanitized and validated
- **API Key Protection**: Environment variable storage
- **Error Handling**: Comprehensive error management
- **File Size Limits**: Prevents abuse and overload

## 🚨 Troubleshooting

### Common Issues

**"No file selected" Error**:
- Ensure file is properly selected
- Check file format (.xlsx or .xls)
- Verify file size under 16MB

**"API Error" Message**:
- Verify `MANUS_API_KEY` is set correctly
- Check internet connection
- Ensure API key has proper permissions

**"Analysis Failed" Error**:
- Check Excel file format and structure
- Ensure file contains readable data
- Try with a smaller file first

**Application Won't Start**:
- Install all requirements: `pip install -r requirements.txt`
- Check Python version (3.8+ recommended)
- Verify all files are in correct locations

### Debug Mode

Enable debug mode for detailed error messages:
```bash
export FLASK_DEBUG=1
python main.py
```

## 📞 Support

### Getting Help
1. Check this README for common solutions
2. Review error messages in browser console
3. Test with sample Excel files first
4. Verify all environment variables are set

### API Documentation
- Manus AI API: [https://api.manus.im/docs](https://api.manus.im/docs)
- Flask Documentation: [https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

## 🔄 Updates & Maintenance

### Regular Updates
- Keep dependencies updated: `pip install -r requirements.txt --upgrade`
- Monitor Manus AI API changes
- Update security patches regularly

### Performance Optimization
- Monitor file upload sizes
- Clean up old files in `uploads/` directory
- Consider adding database for large-scale usage

## 📄 License

This project is proprietary software for luxury watch sales operations.

## 🏆 Success Metrics

Track your success with these KPIs:
- **Client Prioritization Accuracy**: Improved follow-up conversion rates
- **Time Savings**: Reduced manual analysis time by 90%
- **Sales Intelligence**: Enhanced client insights and recommendations
- **Process Efficiency**: Streamlined workflow from data to action

---

**🎯 Ready to revolutionize your luxury watch sales with AI-powered intelligence!**

For technical support or feature requests, please contact your development team.

