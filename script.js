// --- 1. Data Model & Setup ---
const participants = [
    // IMPORTANT: Ensure these image paths are correct relative to index.html
    { name: "Next participant", imagePath: "images/Davo.png" },
    { name: "Get to work", imagePath: "images/Flash.png" },
    { name: "Your Target", imagePath: "images/Griffo.png" },
    { name: "Decided", imagePath: "images/Haysto.png" },
    { name: "Lucky him", imagePath: "images/Hutcho.jpeg" },
    { name: "...and so it follows", imagePath: "images/Risk.png" },
    { name: "Winner Winner", imagePath: "images/Whitey.png" }
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
    // We adjust by -90 because standard SVG 0 degrees is right/East, but our math starts top/North
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
        
        // *****************************************************************
        // *** THE FIX: Rotate the image to align the bottom with the center ***
        // *****************************************************************
        
        // 1. Calculate the angle of the image's center point relative to the wheel's center.
        // The angle needs to compensate for the midAngle of the segment and the initial SVG rotation (-90).
        // midAngle is clockwise from the right side.
        const rotationAngle = midAngle + 90; 
        
        // 2. Apply the rotation transform around the image's own center point
        image.setAttribute(
            "transform", 
            `rotate(${rotationAngle}, ${imagePosition.x}, ${imagePosition.y})`
        );
        
        // 3. Apply the clip path
        image.setAttribute("clip-path", `url(#${clipId})`);
        
        // Add clip path and image to the SVG
        wheelSVG.appendChild(clipPath);
        segmentGroup.appendChild(image);
        
        wheelSVG.appendChild(segmentGroup);
    });
}

// --- 3. Spinning Logic (CORRECTED) ---
function spinWheel() {
    spinButton.disabled = true;
    resultDisplay.textContent = "Spinning...";

    // 1. Determine the Winning Index
    const winningIndex = Math.floor(Math.random() * segmentCount);
    const winningPerson = participants[winningIndex];

    // 2. Calculate the required rotation angle

    // Angle of the center of the winning segment relative to the SVG's current 0-degree mark (top).
    // Note: The segments are drawn starting from the top and going clockwise.
    const targetSegmentCenterAngle = winningIndex * degreesPerSegment + (degreesPerSegment / 2);

    // Calculate the rotation needed to bring the center of the target segment (e.g., segment 0 center is at 25.7 degrees) 
    // to the top (0 degrees). We subtract the target angle.
    // We add a full 360 degrees to ensure the number is positive for the modulo operation.
    const angleToAlignWinner = (360 - targetSegmentCenterAngle) % 360;

    // 3. Add random full revolutions (4 to 6 full spins for visual effect)
    const randomRevolutions = (Math.floor(Math.random() * 3) + 4) * 360; 

    // 4. Final Target Rotation
    // The final rotation is the current rotation, plus full spins, plus the precise alignment angle.
    const finalTargetRotation = currentRotation + randomRevolutions + angleToAlignWinner;

    // 5. Apply the rotation (to the wheel-container div)
    wheelContainer.style.transform = `rotate(${finalTargetRotation}deg)`;

    // Update the total rotation for the next spin
    currentRotation = finalTargetRotation;

    // 6. Display Result After Animation
    // The transition duration is 4s, so we delay the result display by 4s.
    setTimeout(() => {
        spinButton.disabled = false;
        resultDisplay.textContent = `Winner: ${winningPerson.name}!`;
    }, 4000);
}

// ... (Rest of the file remains the same)

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    createSegments(); 
    spinButton.addEventListener('click', spinWheel);
});
