/**
 * Natural Language Task Parser
 * Converts plain text into structured task fields (title, dueDate, priority, category)
 * without requiring external AI APIs.
 */

export function parseNaturalLanguageTask(text) {
  if (!text || typeof text !== "string") {
    return {
      title: "",
      dueDate: "",
      priority: "Medium",
      category: "Other",
      tokens: [],
      isRecognized: false,
    };
  }

  let clean = text.trim();
  const tokensFound = [];
  let detectedPriority = "Medium";
  let detectedCategory = "Other";
  let detectedDate = null;
  let detectedTime = { hours: 17, minutes: 0, specified: false }; // default 5:00 PM if time not explicitly stated

  // 1. PRIORITY PARSING
  const priorityPatterns = [
    { regex: /\b(high priority|urgent|critical|asap|priority:?\s*high|p1)\b/i, priority: "High", label: "High Priority" },
    { regex: /\b(medium priority|priority:?\s*medium|normal priority|p2)\b/i, priority: "Medium", label: "Medium Priority" },
    { regex: /\b(low priority|minor|priority:?\s*low|p3)\b/i, priority: "Low", label: "Low Priority" },
  ];

  for (const { regex, priority, label } of priorityPatterns) {
    if (regex.test(clean)) {
      detectedPriority = priority;
      tokensFound.push(label);
      clean = clean.replace(regex, " ");
      break;
    }
  }

  // 2. CATEGORY PARSING (Explicit keywords first)
  const explicitCategoryPatterns = [
    { regex: /\b(category:?\s*college|for college|college work|college)\b/i, category: "College", label: "College" },
    { regex: /\b(category:?\s*work|for work|at work|work task|office)\b/i, category: "Work", label: "Work" },
    { regex: /\b(category:?\s*personal|for myself|personal task|personal)\b/i, category: "Personal", label: "Personal" },
    { regex: /\b(category:?\s*projects|for project|project work|projects|sideproject)\b/i, category: "Projects", label: "Projects" },
  ];

  let explicitCategoryFound = false;
  for (const { regex, category, label } of explicitCategoryPatterns) {
    if (regex.test(clean)) {
      detectedCategory = category;
      tokensFound.push(label);
      clean = clean.replace(regex, " ");
      explicitCategoryFound = true;
      break;
    }
  }

  // Fallback category heuristic from task contents if no explicit category
  if (!explicitCategoryFound) {
    if (/\b(assignment|exam|quiz|homework|lecture|syllabus|professor|dbms|semester|lab|course|study)\b/i.test(clean)) {
      detectedCategory = "College";
    } else if (/\b(meeting|client|report|presentation|standup|sprint|invoice|stakeholder|manager)\b/i.test(clean)) {
      detectedCategory = "Work";
    } else if (/\b(gym|workout|groceries|doctor|dentist|call|mom|dad|family|bills|cook|dinner)\b/i.test(clean)) {
      detectedCategory = "Personal";
    } else if (/\b(code|bug|feature|deploy|test|frontend|backend|api|database|refactor|repo|git)\b/i.test(clean)) {
      detectedCategory = "Projects";
    }
  }

  // 3. TIME PARSING (e.g. "at 5pm", "at 5:30 pm", "17:00", "9am", "noon", "midnight")
  const timeRegexes = [
    { regex: /\b(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)\b/i, fn: (m) => {
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const ampm = m[3].toLowerCase();
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
      return { hours: h, minutes: min };
    }},
    { regex: /\b(?:at\s+)?(\d{1,2})\s*(am|pm)\b/i, fn: (m) => {
      let h = parseInt(m[1], 10);
      const ampm = m[2].toLowerCase();
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
      return { hours: h, minutes: 0 };
    }},
    { regex: /\b(?:at\s+)?(\d{1,2}):(\d{2})\b/i, fn: (m) => {
      return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10) };
    }},
    { regex: /\b(noon|midday)\b/i, fn: () => ({ hours: 12, minutes: 0 }) },
    { regex: /\b(midnight)\b/i, fn: () => ({ hours: 23, minutes: 59 }) },
    { regex: /\b(tonight|evening)\b/i, fn: () => ({ hours: 20, minutes: 0 }) },
    { regex: /\b(morning)\b/i, fn: () => ({ hours: 9, minutes: 0 }) },
    { regex: /\b(afternoon)\b/i, fn: () => ({ hours: 14, minutes: 0 }) },
  ];

  for (const { regex, fn } of timeRegexes) {
    const match = clean.match(regex);
    if (match) {
      detectedTime = { ...fn(match), specified: true };
      tokensFound.push(`${match[0].trim()}`);
      clean = clean.replace(regex, " ");
      break;
    }
  }

  // 4. DATE PARSING
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  const getNextDayOfWeek = (dayName, isNext = false) => {
    const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
    if (targetDay === -1) return null;
    const currentDay = today.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0 || isNext) {
      daysAhead += 7;
    }
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysAhead);
    return targetDate;
  };

  if (/\b(day after tomorrow)\b/i.test(clean)) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    detectedDate = d;
    tokensFound.push("Day after tomorrow");
    clean = clean.replace(/\b(day after tomorrow)\b/i, " ");
  } else if (/\b(tomorrow)\b/i.test(clean)) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    detectedDate = d;
    tokensFound.push("Tomorrow");
    clean = clean.replace(/\b(tomorrow)\b/i, " ");
  } else if (/\b(today|tonight)\b/i.test(clean)) {
    detectedDate = new Date(today);
    tokensFound.push("Today");
    clean = clean.replace(/\b(today|tonight)\b/i, " ");
  } else {
    // Check "next [weekday]" or "this [weekday]" or "on [weekday]"
    const weekdayRegex = /\b(?:next|this|on|by)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
    const weekMatch = clean.match(weekdayRegex);
    if (weekMatch) {
      const isNext = /next/i.test(weekMatch[0]);
      detectedDate = getNextDayOfWeek(weekMatch[1], isNext);
      tokensFound.push(weekMatch[0].trim());
      clean = clean.replace(weekdayRegex, " ");
    } else {
      // Check "in X days"
      const inDaysMatch = clean.match(/\bin\s+(\d+)\s+days?\b/i);
      if (inDaysMatch) {
        const d = new Date(today);
        d.setDate(today.getDate() + parseInt(inDaysMatch[1], 10));
        detectedDate = d;
        tokensFound.push(inDaysMatch[0].trim());
        clean = clean.replace(/\bin\s+(\d+)\s+days?\b/i, " ");
      }
    }
  }

  // Clean trailing/leading prepositions from title: "by", "on", "at", "due", "for"
  let cleanTitle = clean
    .replace(/\s+/g, " ")
    .replace(/^(due|by|on|at|for)\s+/i, "")
    .replace(/\s+(due|by|on|at|for)$/i, "")
    .trim();

  // Strip dangling punctuation
  cleanTitle = cleanTitle.replace(/^[-–—:,.]+|[-–—:,.]+$/g, "").trim();

  if (!cleanTitle) {
    cleanTitle = text.trim();
  }

  // Format date to YYYY-MM-DD
  let formattedDueDate = "";
  if (detectedDate) {
    const year = detectedDate.getFullYear();
    const month = String(detectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(detectedDate.getDate()).padStart(2, "0");
    formattedDueDate = `${year}-${month}-${day}`;
  }

  return {
    title: cleanTitle,
    dueDate: formattedDueDate,
    time: detectedTime,
    priority: detectedPriority,
    category: detectedCategory,
    tokens: tokensFound,
    isRecognized: tokensFound.length > 0 || detectedCategory !== "Other",
  };
}
