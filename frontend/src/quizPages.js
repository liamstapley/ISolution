const quizPages = [
  {
    id: "lifestyle",
    title: "Lifestyle",
    fields: [
      {
        id: "ageRange",
        label: "How old are you?",
        type: "single",
        options: ["<18", "18–20", "21–29", "30–40", "40+"],
        required: true
      },
      {
        id: "schoolStatus",
        label: "Are you in school?",
        type: "single",
        options: ["High school", "College", "Grad", "Career"],
        required: true
      },
      {
        id: "freeTime",
        label: "Free time (per day)",
        type: "single",
        options: ["1 hr", "3 hr", "6 hr", "12 hrs"],
        required: true
      }
    ]
  },
  {
    id: "schedule",
    title: "Schedule",
    fields: [
      {
        id: "wakeTime",
        label: "When do you typically wake up?",
        type: "single",
        options: ["5–6", "7–8", "9–10", "11–12"],
        required: true
      },
      {
        id: "sleepTime",
        label: "When do you typically go to sleep?",
        type: "single",
        options: ["7–8", "9–10", "11–12", "1–3"],
        required: true
      },
      {
        id: "freeDays",
        label: "What weekdays are you most free?",
        type: "multi", // multi-select pills
        options: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
        required: true,
        minSelect: 1
      }
    ]
  },
  {
    id: "goals",
    title: "Goals",
    fields: [
      {
        id: "eventsPerWeek",
        label: "How many events do you want to attend?",
        type: "single",
        options: ["1–3","4–6","7–10","10–20+"],
        required: true
      },
      {
        id: "volunteerHours",
        label: "How many hours do you want to volunteer?",
        type: "single",
        options: ["1–3","4–6","7–10","10–20+"],
        required: false
      },
      {
        id: "jobSatisfaction",
        label: "Job satisfaction",
        type: "single",
        options: ["unhappy","neutral","thrilled"],
        required: false
      }
    ]
  }
];

export default quizPages;