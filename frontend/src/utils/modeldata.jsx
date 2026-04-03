export const messages = [
  { _id: "201", lead_id: { name: "Alice Johnson" }, channel: "EMAIL", content: "Follow-up email sent", status: "SENT" },
  { _id: "202", lead_id: { name: "Bob Smith" }, channel: "EMAIL", content: "Initial response email", status: "FAILED" },
];

export const sequences = [
  {
    _id: "301",
    name: "Lead Follow-up Sequence",
    steps: [
      { order: 1, channel: "EMAIL", content: "First follow-up after 2 days", delayMinutes: 2880 },
      { order: 2, channel: "EMAIL", content: "Second follow-up after 4 days", delayMinutes: 5760 },
      { order: 3, channel: "EMAIL", content: "Final reminder after 6 days", delayMinutes: 8640 },
    ],
    active: true,
  },
];