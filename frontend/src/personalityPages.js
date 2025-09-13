const personalityPages = [
  {
    id: "personality-1",
    title: "Personality",
    fields: [
      {
        id: "decisionStyle",
        label:
          "When faced with a big decision, do you usually rely more on logic or your gut instinct?",
        type: "single",
        options: ["Logic", "Gut instinct"],
        required: true,
      },
      {
        id: "groupRole",
        label:
          "In a group project, which role do you naturally take on?",
        type: "single",
        options: ["Leader", "Planner", "Supporter", "Innovator"],
        required: true,
      },
    ],
  },
  {
    id: "personality-2",
    title: "Personality",
    fields: [
      {
        id: "recharge",
        label:
          "How do you usually recharge after a long week?",
        type: "single",
        options: ["Spending time with friends", "Quiet time alone"],
        required: true,
      },
      {
        id: "superAbility",
        label:
          "If you could instantly gain one ability, which would you choose?",
        type: "single",
        options: [
          "Perfect memory",
          "Unlimited creativity",
          "Flawless social skills",
          "Unstoppable discipline",
        ],
        required: true,
      },
    ],
  },
  {
    id: "personality-3",
    title: "Personality",
    fields: [
      {
        id: "problemApproach",
        label:
          "When encountering an unexpected problem, what’s your approach?",
        type: "single",
        options: [
          "Carefully analyze step by step",
          "Jump right in and figure it out",
        ],
        required: true,
      },
    ],
  },
];

export default personalityPages;