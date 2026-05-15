const COMPANY = {
  name: "Netcradus Private Limited",
  website: "www.netcradus.com",
  email: "info@netcradus.com",
  hrEmail: "hr@netcradus.com",
  tollFree: "1800 121 008800",
  indiaOffice: "Y-10, Himalaya Tanishq Raj Nagar Extension, Ghaziabad, UP - 201017",
  globalOffice: "London Road, Leicester LE2 0QS, England, UK",
  gst: "09AAKCN7195G1ZV",
  jurisdiction: "Delhi Courts",
  accentColor: "#e8420a",
};

const AGREEMENT_SECTIONS = [
  {
    title: "1. Appointment and Role",
    paragraphs: [
      "The Employee is appointed by Netcradus Private Limited in the role specified in this agreement or as otherwise assigned by the Company. The Employee agrees to perform all duties diligently, lawfully and in the best interests of the Company.",
      "The Employee shall comply with all lawful instructions, policies, reporting structures, operational procedures and standards applicable to the assigned role, department and business functions of Netcradus Private Limited.",
    ],
  },
  {
    title: "2. Working Hours and Service Expectations",
    paragraphs: [
      "The Employee acknowledges that working hours, schedules, shift assignments, reporting requirements and attendance obligations shall be governed by Company policy and may be revised from time to time based on business requirements.",
      "The Employee shall devote full professional time, attention and effort to Company work during assigned working hours and shall not undertake conflicting engagements without prior written approval from the Company.",
    ],
  },
  {
    title: "3. Confidentiality and Non-Disclosure",
    paragraphs: [
      "The Employee shall keep strictly confidential all business, commercial, technical, financial, operational, client, employee and strategic information belonging to the Company or its clients, whether disclosed orally, digitally, visually or in writing.",
      "Confidential Information includes source code, product designs, CRM data, SIEM and ACIS related material, internal processes, security configurations, pricing, business plans, credentials, customer information and any unpublished proprietary material.",
      "The Employee shall not copy, share, disclose, publish, remove, misuse or retain Confidential Information except as required for authorized Company work. These confidentiality obligations survive termination of employment.",
    ],
  },
  {
    title: "4. Data Protection and Acceptable Use",
    paragraphs: [
      "The Employee shall use Company systems, software, email accounts, storage, devices and access credentials only for authorized work purposes and in accordance with Company security requirements.",
      "The Employee shall protect client and Company data, follow least privilege access principles, avoid unauthorized software, avoid unsecured devices, promptly report incidents, and refrain from storing sensitive business data on personal devices unless explicitly approved.",
      "All activities on Company systems may be monitored, logged and reviewed for security, compliance and operational purposes in accordance with applicable law and Company policy.",
    ],
  },
  {
    title: "5. Intellectual Property Assignment",
    paragraphs: [
      "All work product, inventions, discoveries, developments, documents, code, designs, databases, inventions, improvements, concepts, processes and materials created, conceived or reduced to practice by the Employee during employment that relate to the business of the Company shall belong exclusively to Netcradus Private Limited.",
      "The Employee irrevocably assigns to the Company all rights, title and interest in such work product and agrees to execute any further documents reasonably required to perfect or record the Company's ownership rights.",
    ],
  },
  {
    title: "6. Compliance, Conduct and Legal Liability",
    paragraphs: [
      "The Employee shall comply with all applicable laws, internal policies, confidentiality obligations, information security requirements, anti-fraud standards and professional conduct expectations communicated by the Company from time to time.",
      "Any unauthorized disclosure, misuse of confidential information, policy breach, data exfiltration, credential sharing, theft of Company property, unlawful conduct or material misrepresentation may result in disciplinary action, recovery of losses, legal action and termination of employment.",
    ],
  },
  {
    title: "7. Termination and Post-Employment Obligations",
    paragraphs: [
      "Employment may be terminated in accordance with applicable law, the terms of engagement and Company policy. On termination or on request, the Employee shall immediately return all Company property, documents, credentials, records and materials in any form.",
      "The Employee shall not retain copies of confidential or proprietary materials after termination and shall continue to honor confidentiality, intellectual property and data protection obligations after the employment relationship ends.",
    ],
  },
  {
    title: "8. Governing Law and Jurisdiction",
    paragraphs: [
      "This agreement shall be governed by and construed in accordance with the laws of India.",
      `Any dispute arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the ${COMPANY.jurisdiction}.`,
    ],
  },
];

const NDA_SECTIONS = [
  {
    title: "Non-Disclosure Agreement",
    paragraphs: [
      "The Employee agrees that all confidential and proprietary information of Netcradus Private Limited and its clients shall be used solely for authorized employment purposes and shall not be disclosed to any third party without prior written consent.",
      "The Employee shall take all reasonable steps to safeguard confidential information, prevent unauthorized access, and immediately report any actual or suspected loss, breach or misuse of confidential information.",
      "The Employee shall not directly or indirectly use confidential knowledge, internal systems, client information, code, workflows, tools or strategies to compete with, harm or unfairly disadvantage Netcradus Private Limited.",
    ],
  },
];

const VERIFICATION_DECLARATION =
  "I hereby declare that the information provided by me is true and correct to the best of my knowledge and belief. I understand that providing false or misleading information may result in disciplinary action, including termination of employment.";

module.exports = {
  COMPANY,
  AGREEMENT_SECTIONS,
  NDA_SECTIONS,
  VERIFICATION_DECLARATION,
};
