export const eventData = {
  rubric: [
    {
      title: 'Forensic Relevance and Scientific Validity',
      weight: '20%',
      focus: 'Adherence to forensic principles, scientific accuracy, appropriate interpretation, evidence handling and quality assurance.'
    },
    {
      title: 'Technical Innovation and System Architecture',
      weight: '20%',
      focus: 'Software/hardware design, algorithm quality, technical originality and appropriate use of AI/ML or cybersecurity.'
    },
    {
      title: 'Functional Prototype / MVP Completeness',
      weight: '20%',
      focus: 'Working prototype, core functionality, usability, stability and demonstration against the stated objective.'
    },
    {
      title: 'Cybersecurity, Evidence Integrity and Privacy',
      weight: '15%',
      focus: 'Access control, hash verification where applicable, audit trails, privacy safeguards and safe data handling.'
    },
    {
      title: 'Interdisciplinary Collaboration',
      weight: '10%',
      focus: 'Meaningful and balanced contribution from Forensic Science and technical team members.'
    },
    {
      title: 'Practical Applicability',
      weight: '10%',
      focus: 'Feasibility and potential usefulness in forensic laboratories, investigations or public safety.'
    },
    {
      title: 'Presentation, Pitch and Demonstration',
      weight: '5%',
      focus: 'Clarity, demonstration quality, explanation of results and limitations, and completeness of documentation.'
    }
  ],
  guidelines: [
    'Interdisciplinary design: Every solution must include a clearly defined forensic objective and a meaningful technical implementation.',
    'Approved data only: Use synthetic, anonymised, public or organiser-approved datasets. Real case records or sensitive victim information may be used only with formal authorisation and appropriate safeguards.',
    'Digital evidence integrity: Preserve original source files where applicable, calculate cryptographic hashes, record processing steps and maintain an auditable record. A hash supports integrity verification but does not alone establish authenticity or admissibility.',
    'Responsible AI: Distinguish model outputs from expert conclusions. Report limitations, uncertainty and relevant evaluation metrics; retain human review for consequential interpretations.',
    'Cybersecurity and safety: Testing must be authorised and contained. Unauthorised intrusion, credential extraction, interception, access to private accounts or intrusive deanonymisation is prohibited.',
    'Sensitive material: Do not access, download, store or display illegal or harmful content. Challenges involving child protection or sensitive evidence must use synthetic or formally approved safe datasets.',
    'Prototype feasibility: A prototype, simulation or proof of concept is acceptable. Research-grade validation or production deployment is not required during the hackathon.',
    'Testing and documentation: Evaluate against defined test cases and, where applicable, report precision, recall, false-positive/false-negative rates, repeatability, processing time or measurement uncertainty.'
  ],
  submissions: [
    'Project title and selected problem statement ID.',
    'Team member details, academic programmes and contribution summary.',
    'Problem definition, proposed solution and target users.',
    'Forensic workflow and technical architecture.',
    'Working prototype, simulation or proof of concept, with a short user guide.',
    'Dataset sources, permissions and privacy/safety statement.',
    'Evaluation method, results, limitations and proposed improvements.',
    'Presentation slides or poster and a concise project report.'
  ]
};

export default eventData;
