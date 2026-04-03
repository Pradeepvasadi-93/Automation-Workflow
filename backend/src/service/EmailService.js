require('dotenv').config()
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        type : 'OAuth2',
        user : process.env.USER_EMAIL,
        clientId : process.env.CLIENT_ID,
        clientSecret : process.env.CLIENT_SECRET,
        refreshToken : process.env.REFRESH_TOKEN
    }
});

transporter.verify((err, success)=>{
    if(err){
        console.log("Error setting up email transport:", err);  
    }else{
        console.log("Email transport is ready to send messages");
    }
});

const sendEmail = async (to, subject, text, html) => {
    try{
        const info = await transporter.sendMail({
            from : `"BusinessLabs" <${process.env.USER_EMAIL}>`,
            to, // list of recievers
            subject, // Subject line
            text, // plain text body
            html // html body
        });
        console.log("Email sent successfully:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);

    }
}

const sendEmailToLead = async (userEmail, name) => {
  const subject = "Thank you for reaching out to BusinessLabs";

  const safeName = name || "there";

  const text = `Hello ${safeName},\n\nThank you for contacting us and sharing your query with BusinessLabs. We’re excited to learn more about your needs and how we can support you.\n\nOur team is reviewing your request and will get back to you within 1/2 days with a detailed response. At [Your Startup Name], we pride ourselves on delivering [your key value: e.g., scalable automation solutions, personalized support, etc.].\n\nWe look forward to partnering with you.
\nBest regards,\nThe BusinessLabs Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <p>Hello ${safeName},</p>

      <p>Thank you for contacting us and sharing your query with <strong>BusinessLabs</strong>.</p>

      <p>
        We're excited to learn more about your needs and how we can support you. Our team is reviewing your request and will get back to you within <strong>1/2 days</strong> with a detailed response.
      </p>

      <p>We look forward to partnering with you.</p>

      <p>
        Best regards,<br />
        The BusinessLabs Team
      </p>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
};

const sendInitialDraftEmail = async (userEmail, leadName, draftResponse) => {
  if (!userEmail) {
    console.error("No recipient email provided for lead:", leadName);
    return;
  }

  const subject = "Following Up on Our Recent Discussion";

  const safeName = leadName || "there";

  const text = `Dear ${safeName},\n\nI hope this message finds you well. Thank you for taking the time to connect with us. As discussed, I wanted to share the initial draft response for your review:\n\n${draftResponse}\n\nPlease let me know if this aligns with your expectations or if you’d like us to refine any details further. Your feedback is important, and we’re committed to ensuring this solution meets your needs.\n\nLooking forward to your thoughts.\n\nBest regards,\n[Your Name]\n[Your Position]\n[Your Company]`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <p>Dear ${safeName},</p>

      <p>I hope this message finds you well. Thank you for taking the time to connect with us. As discussed, I wanted to share the initial draft response for your review:</p>

      <blockquote style="border-left: 3px solid #ccc; margin: 10px 0; padding-left: 10px; color: #555;">
        ${draftResponse}
      </blockquote>

      <p>Please let me know if this aligns with your expectations or if you’d like us to refine any details further. Your feedback is important, and we’re committed to ensuring this solution meets your needs.</p>

      <p>Looking forward to your thoughts.</p>

      <p>
        Best regards,<br />
        BusinessLabs Team
      </p>
    </div>
  `;

  await sendEmail(userEmail, subject, text, html);
};


module.exports = { sendEmail, sendEmailToLead, sendInitialDraftEmail };