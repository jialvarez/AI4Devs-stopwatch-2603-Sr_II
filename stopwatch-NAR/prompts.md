# Chatbot utilizado: Gemini Pro

**Role**: Act as a Senior Frontend Developer specializing in clean UI/UX and vanilla JavaScript.

**Objective**: Create a fully functional, responsive web-based Stopwatch and Countdown timer. The design should be inspired by "Online-Stopwatch.com"—meaning a large, clear digital display, intuitive control buttons, and a professional aesthetic.

**Task Details:**

1. HTML: Provide a semantic structure. Include a main display for the time, a toggle section to switch between "Stopwatch" and "Countdown" modes, and control buttons (Start, Stop, Clear/Reset).

2. CSS: Create a modern, dark-themed or high-contrast layout. Use Flexbox or Grid for centering. Ensure the digital font looks professional (e.g., monospace or a digital-clock style).

3. JavaScript:
* Stopwatch: Must track hours, minutes, seconds, and milliseconds ($00:00:00:000$).
* Countdown: Allow the user to input a starting time. When the time reaches zero, provide a visual alert (e.g., flashing background or text).
* Logic: Use setInterval or requestAnimationFrame for accuracy. Ensure "Start" becomes "Pause" when active, and "Clear" resets all values.

**Constraint & Format:**

Provide the solution in two distinct blocks: index.html (including internal CSS for simplicity, or separate if preferred) and script.js.
Do not use external libraries (like jQuery or React). Use pure Vanilla JS.
Add comments explaining the logic for the timer increments.

**Style/Tone:** Professional, clean code, and user-friendly interface.