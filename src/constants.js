export const DEPT = {
    ordarly: { name: 'Ordarly', color: '#159B69', blurb: 'Restaurants and food businesses' },
    keykonnec: { name: 'KeyKonnec', color: '#0F9D9A', blurb: 'Hotels, shortlets and hospitality' },
    website: { name: 'Website Outreach', color: '#3157D5', blurb: 'Businesses that need a website' },
};
export const STATUSES = ['New', 'Outreach Opened', 'Contacted', 'Responded', 'Interested', 'Demo Requested', 'Demo Sent', 'Negotiating', 'Converted', 'No Response', 'Not Interested', 'Invalid Contact', 'Do Not Contact', 'Pricing Requested', 'Information Requested', 'Objection Raised', 'Follow-up Required'];
export const MANUAL_STATUSES = STATUSES.filter((s) => !['Outreach Opened', 'Contacted'].includes(s));
export const PURPOSES = { initial_outreach: 'Initial outreach', introduction: 'Introduction', no_response_followup: 'No-response follow-up', after_demo_followup: 'After-demo follow-up', interested_prospect: 'Interested prospect', management_contact_request: 'Management contact request', pricing_enquiry: 'Pricing enquiry', objection_handling: 'Objection handling', demo_invitation: 'Demo invitation', signup_invitation: 'Signup invitation', final_followup: 'Final follow-up' };
export const fmt = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-');
export const fmtDay = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-');
