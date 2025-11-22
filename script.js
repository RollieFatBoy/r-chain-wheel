// --- 1. Data Model ---
const participants = [
    { name: "Participant A", imagePath: "images/face_01.png" },
    { name: "Participant B", imagePath: "images/face_02.png" },
    { name: "Participant C", imagePath: "images/face_03.png" },
    { name: "Participant D", imagePath: "images/face_04.png" },
    { name: "Participant E", imagePath: "images/face_05.png" },
    { name: "Participant F", imagePath: "images/face_06.png" },
    { name: "Participant G", imagePath: "images/face_07.png" }
];

const segmentCount = participants.length;
const degreesPerSegment = 360 / segmentCount;

const wheelContainer = document.querySelector('.wheel-container');
const spinButton = document.getElementById('spinButton');
const resultDisplay = document.getElementById('resultDisplay');

let currentRotation = 0; // Tracks the total degrees the wheel has spun

// --- 2. Dynamic Segment Generation ---
function createSegments() {
    participants.forEach((person, index) => {
        const segment = document.createElement('div');
        segment.classList.add('segment');

        // Calculate the rotation needed to position the segment correctly
        const rotationAngle = index * degreesPerSegment;
        
        // Rotate the entire segment wedge
        segment.style.transform = `rotate(${rotationAngle}deg) skewY(${90 - degreesPerSegment}deg)`;
        
        // --- Segment Content (Image and Label) ---
        const content = document.createElement('div');
        content.classList.add('segment-content');

        const image = document.createElement('img');
        image.src = person.imagePath; // Set the image source
        image.alt = person.name;
        image.classList.add('face-image');
        
        // For accurate face placement, we need to counter-rotate the image
        // 1. Un-skew the segment to make the image area square
        content.style.transform = `skewY(${-(90 - degreesPerSegment)}deg) rotate(${degreesPerSegment / 2}deg)`;
        
        content.appendChild(image);
        segment.appendChild(content);
        wheelContainer.appendChild(segment);
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

    // Angle needed to align the *center* of the winning segment with the pointer (top center is 270 degrees)
    // The segment 0 is centered at 0 degrees, segment 1 at 51.42, etc.
    const targetSegmentCenterAngle = winningIndex * degreesPerSegment;

    // The wheel must rotate so that the winning segment's center ends up at the pointer position (270 degrees).
    // The rotation is applied clockwise (positive degrees).
    // We add 90 degrees to compensate for the initial CSS placement setup.
    const requiredAngleToTarget = (270 - targetSegmentCenterAngle);

    // 3. Add random full revolutions (4 to 6 full spins for visual effect)
    const randomRevolutions = (Math.floor(Math.random() * 3) + 4) * 360; 

    // 4. Final Target Rotation
    // The required angle is applied *on top of* the current rotation, plus the full spins.
    const finalTargetRotation = currentRotation + randomRevolutions + requiredAngleToTarget;

    // 5. Apply the rotation via CSS transform
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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Note: Due to CSS limitations for complex pie charts, 
    // we use transform/skew which can sometimes distort the contents slightly.
    createSegments(); 
    spinButton.addEventListener('click', spinWheel);
});