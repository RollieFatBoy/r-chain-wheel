// --- 1. Data Model & Setup ---
const participants = [
    // IMPORTANT: Ensure these image paths are correct relative to index.html
    { name: "Participant A", imagePath: "images/Hutcho.jpeg" },
    { name: "Participant B", imagePath: "images/Griffo.png" },
    { name: "Participant C", imagePath: "images/face_03.png" },
    { name: "Participant D", imagePath: "images/face_04.png" },
    { name: "Participant E", imagePath: "images/face_05.png" },
    { name: "Participant F", imagePath: "images/face_06.png" },
    { name: "Participant G", imagePath: "images/face_07.png" }
];

const segmentCount = participants.length;
const degreesPerSegment = 360 / segmentCount;

const wheelContainer = document.querySelector('.wheel-container');
const wheelSVG = document.getElementById('wheelSVG');
const spinButton = document.getElementById('spinButton');
const resultDisplay = document.getElementById('resultDisplay');

let currentRotation = 0; 

// Design Colors (matching CSS variables)
const RED_VELVET_DARK = "#64121F";
const RED_VELVET_LIGHT = "#8E1F30";

// SVG Constants (based on viewBox="0 0 400 400")
const wheelRadius = 200; 
const center = 200; 

// --- Helper Functions for SVG Geometry ---

/**
 * Converts polar coordinates (angle, radius) to Cartesian coordinates (x, y).
 * Angle is measured clockwise from the positive X-axis (right side).
 */
function polarToCartesian(angleInDegrees, radius) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: center + (radius * Math.cos(angleInRadians)),
        y: center + (radius * Math.sin(angleInRadians))
    };
}

/**
 * Creates the SVG Path data string for one segment (pie wedge).
 */
function describeArc(startAngle, endAngle) {
    const start = polarToCartesian(startAngle, wheelRadius);
    const end = polarToCartesian(endAngle, wheelRadius);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    // SVG Path Commands:
    const d = [
        "M", center, center, // M: Move to the center 
        "L", start.x, start.y, // L: Line to the starting point on the circle
        "A", wheelRadius, wheelRadius, 0, largeArcFlag, 1, end.x, end.y, // A: Arc to the ending point
        "Z" // Z: Close the path back to the center
    ].join(" ");

    return d;
}

// --- 2. Dynamic Segment Generation (SVG) ---
function createSegments() {
    participants.forEach((person, index) => {
        const startAngle = index * degreesPerSegment;
        const endAngle = (index + 1) * degreesPerSegment;
        
        // 1. Create a <g> group for the segment (path and image)
        const segmentGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // 2. Create the <path> (Red Velvet Shape)
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", describeArc(startAngle, endAngle));
        path.classList.add("svg-segment");
        // Alternate colors
        path.setAttribute("fill", index % 2 === 0 ? RED_VELVET_LIGHT : RED_VELVET_DARK); 
        segmentGroup.appendChild(path);

        // 3. Place the face <image>
        const midAngle = startAngle + (degreesPerSegment / 2);
        const imageOffsetRadius = wheelRadius * 0.65; // Place image 65% of the way out
        const imagePosition = polarToCartesian(midAngle, imageOffsetRadius);
        
        const imageSize = 70;
        
        // --- Create a circular clip path ---
        const clipId = `clip-${index}`;
        const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.setAttribute("id", clipId);
        
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", imagePosition.x);
        circle.setAttribute("cy", imagePosition.y);
        circle.setAttribute("r", imageSize / 2); 
        
        clipPath.appendChild(circle);
        
        // --- Create the image element ---
        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("href", person.imagePath);
        image.setAttribute("width", imageSize);
        image.setAttribute("height", imageSize);
        
        // Center the image at the calculated position
        image.setAttribute("x", imagePosition.x - (imageSize / 2));
        image.setAttribute("y", imagePosition.y - (imageSize / 2));
        
        // Apply the clip path to make the image circular
        image.setAttribute("clip-path", `url(#${clipId})`);
        
        // Add clip path and image to the SVG
        wheelSVG.appendChild(clipPath);
        segmentGroup.appendChild(image);
        
        wheelSVG.appendChild(segmentGroup);
    });
}

// --- 3. Spinning Logic ---
function spinWheel() {
    spinButton.disabled = true;
    resultDisplay.textContent = "Spinning...";

    // 1. Determine the Winning Index
    const winningIndex = Math.floor(Math.random() * segmentCount);
    const winningPerson = participants[winningIndex];

    // 2. Calculate the required rotation angle

    // The wheel is initially rotated -90 degrees in CSS to align segment 0 with the pointer position (top).
    // The pointer is fixed at the top (0 degrees visually).
    
    // Angle needed to align the *center* of the winning segment with 0 degrees (the right side in SVG space)
    const targetSegmentCenterAngle = winningIndex * degreesPerSegment + (degreesPerSegment / 2);

    // This calculates the required rotation to land the winning segment's center at the visual pointer (0 degrees/top).
    // The -90 accounts for the initial SVG rotation.
    const requiredAngleToTarget = -90 - targetSegmentCenterAngle;

    // 3. Add random full revolutions (4 to 6 full spins for visual effect)
    const randomRevolutions = (Math.floor(Math.random() * 3) + 4) * 360; 

    // 4. Final Target Rotation
    // The rotation is applied *on top of* the current rotation, plus the full spins.
    const finalTargetRotation = currentRotation + randomRevolutions + requiredAngleToTarget;

    // 5. Apply the rotation (to the wheel-container div)
    wheelContainer.style.transform = `rotate(${finalTargetRotation}deg)`;

    // Update the total rotation for the next spin (we use the absolute final angle)
    currentRotation = finalTargetRotation;

    // 6. Display Result After Animation
    // The transition duration is 4s, so we delay the result display by 4s.
    setTimeout(() => {
        spinButton.disabled = false;
        resultDisplay.textContent = `Winner: ${winningPerson.name}!`;
    }, 4000);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Build the segments using SVG
    createSegments(); 
    
    // 2. Attach event listener to the button
    spinButton.addEventListener('click', spinWheel);
});
