/** Original vector reference poses. Coordinates share a 280 × 240 drawing area. */
export type Point = readonly [number, number];
type Limb = readonly [Point, Point];

export interface ExercisePose {
  head: Point;
  shoulder: Point;
  hip: Point;
  arms: readonly [Limb, Limb];
  legs: readonly [Limb, Limb];
  toes?: readonly [Point, Point];
  /** Curved spine for cat–cow; other poses use a neutral, straight torso. */
  spine?: string;
  wall?: boolean;
}

interface Position {
  label: string;
  description: string;
  pose: ExercisePose;
}

export interface ExerciseVisual {
  positions: readonly [Position, Position, ...Position[]];
  cue: string;
}

const standing: ExercisePose = {
  head: [140, 38], shoulder: [140, 66], hip: [140, 132],
  arms: [[[125, 103], [122, 145]], [[155, 103], [158, 145]]],
  legs: [[[125, 175], [118, 216]], [[155, 175], [162, 216]]],
};
const squat: ExercisePose = {
  head: [156, 80], shoulder: [144, 106], hip: [111, 153],
  arms: [[[172, 112], [208, 110]], [[170, 123], [204, 123]]],
  legs: [[[161, 163], [148, 216]], [[141, 164], [128, 216]]],
};
const lunge: ExercisePose = {
  head: [136, 61], shoulder: [134, 89], hip: [130, 150],
  arms: [[[113, 116], [111, 153]], [[155, 118], [156, 153]]],
  legs: [[[188, 152], [190, 216]], [[83, 210], [43, 216]]],
};
const highPlank: ExercisePose = {
  head: [52, 99], shoulder: [78, 116], hip: [151, 157],
  arms: [[[72, 165], [65, 214]], [[88, 168], [82, 214]]],
  legs: [[[192, 185], [234, 212]], [[198, 179], [244, 208]]],
};
const handsAndKnees: ExercisePose = {
  head: [60, 111], shoulder: [85, 135], hip: [177, 139],
  arms: [[[82, 175], [78, 214]], [[98, 173], [96, 211]]],
  legs: [[[178, 209], [228, 214]], [[194, 201], [243, 205]]],
};
const onBack: ExercisePose = {
  head: [38, 199], shoulder: [65, 207], hip: [139, 208],
  arms: [[[91, 214], [125, 215]], [[88, 200], [123, 202]]],
  legs: [[[178, 157], [219, 214]], [[191, 164], [235, 210]]],
};
const deadBug: ExercisePose = {
  ...onBack,
  arms: [[[70, 170], [70, 129]], [[85, 171], [85, 132]]],
  legs: [[[151, 150], [203, 149]], [[165, 159], [218, 159]]],
};
const sideLunge: ExercisePose = {
  head: [173, 78], shoulder: [166, 105], hip: [153, 157],
  arms: [[[141, 124], [162, 137]], [[189, 125], [165, 137]]],
  legs: [[[89, 187], [34, 216]], [[209, 159], [218, 216]]],
};

export const EXERCISE_VISUALS = {
  squat: {
    positions: [
      { label: 'Stand tall', description: 'Feet shoulder-width apart, toes slightly out.', pose: standing },
      { label: 'Sit back', description: 'Bend your hips and knees, then stand again.', pose: squat },
    ], cue: 'Keep your heels down and your chest lifted.',
  },
  'reverse-lunge': {
    positions: [
      { label: 'Stand tall', description: 'Start with feet hip-width apart.', pose: standing },
      { label: 'Step back & lower', description: 'Bend both knees, then return and switch legs.', pose: lunge },
    ], cue: 'Keep the front knee above the ankle.',
  },
  'side-lunge': {
    positions: [
      { label: 'Feet wide', description: 'Start in a wide stance with both legs straight.', pose: {
        ...standing, legs: [[[90, 174], [43, 216]], [[190, 174], [237, 216]]],
      } },
      { label: 'Shift to one side', description: 'Bend one knee and sit back; return and switch.', pose: sideLunge },
    ], cue: 'Keep the other leg straight and both feet on the floor.',
  },
  'push-up': {
    positions: [
      { label: 'High plank', description: 'Hands slightly wider than your shoulders.', pose: highPlank },
      { label: 'Lower & push up', description: 'Lower your chest with elbows angled back.', pose: {
        head: [48, 164], shoulder: [75, 176], hip: [148, 191],
        arms: [[[109, 187], [65, 215]], [[119, 179], [82, 212]]],
        legs: [[[191, 202], [234, 214]], [[199, 196], [244, 208]]],
      } },
    ], cue: 'Move your whole body together in a straight line.',
  },
  'glute-bridge': {
    positions: [
      { label: 'Lie back', description: 'Bend your knees and keep your feet flat.', pose: onBack },
      { label: 'Lift your hips', description: 'Squeeze your glutes, pause, then lower slowly.', pose: {
        ...onBack, hip: [136, 177],
        legs: [[[183, 157], [219, 214]], [[196, 159], [235, 211]]],
      } },
    ], cue: 'At the top, shoulders, hips and knees form one line.',
  },
  'single-leg-deadlift': {
    positions: [
      { label: 'Balance on one leg', description: 'Keep a soft bend in the standing knee.', pose: {
        ...standing, legs: [[[133, 175], [130, 216]], [[170, 168], [173, 192]]],
      } },
      { label: 'Hinge forward', description: 'Reach down as your other leg extends behind.', pose: {
        head: [41, 117], shoulder: [68, 125], hip: [144, 139],
        arms: [[[65, 161], [67, 195]], [[81, 162], [82, 198]]],
        legs: [[[137, 179], [145, 216]], [[194, 135], [244, 128]]],
      } },
    ], cue: 'Keep your back flat and your hips facing the floor.',
  },
  'calf-raise': {
    positions: [
      { label: 'Heels down', description: 'Stand tall with feet hip-width apart.', pose: standing },
      { label: 'Rise onto your toes', description: 'Lift your heels, pause, then lower slowly.', pose: {
        head: [140, 24], shoulder: [140, 52], hip: [140, 118],
        arms: [[[125, 89], [122, 131]], [[155, 89], [158, 131]]],
        legs: [[[126, 161], [119, 202]], [[154, 161], [161, 202]]],
        toes: [[133, 216], [175, 216]],
      } },
    ], cue: 'Keep the balls of your feet on the floor as your heels lift.',
  },
  'wall-sit': {
    positions: [
      { label: 'Back against a wall', description: 'Walk your feet slightly forward.', pose: {
        ...standing, head: [74, 38], shoulder: [70, 66], hip: [70, 132], wall: true,
        arms: [[[87, 104], [90, 145]], [[97, 104], [99, 143]]],
        legs: [[[100, 175], [124, 216]], [[116, 171], [141, 216]]],
      } },
      { label: 'Slide down & hold', description: 'Thighs horizontal, knees above ankles.', pose: {
        head: [75, 62], shoulder: [70, 90], hip: [70, 153], wall: true,
        arms: [[[100, 122], [128, 149]], [[110, 118], [145, 146]]],
        legs: [[[142, 153], [142, 216]], [[159, 151], [159, 212]]],
      } },
    ], cue: 'Keep your back against the wall throughout the hold.',
  },
  superman: {
    positions: [
      { label: 'Lie face down', description: 'Reach both arms forward with legs long.', pose: {
        head: [66, 196], shoulder: [88, 207], hip: [156, 208],
        arms: [[[60, 211], [22, 212]], [[65, 199], [27, 201]]],
        legs: [[[196, 209], [242, 213]], [[202, 201], [251, 203]]],
      } },
      { label: 'Lift gently', description: 'Raise arms, chest and legs slightly; pause and lower.', pose: {
        head: [65, 168], shoulder: [88, 181], hip: [156, 208],
        arms: [[[55, 174], [22, 167]], [[62, 163], [28, 155]]],
        legs: [[[196, 192], [242, 178]], [[204, 186], [252, 168]]],
      } },
    ], cue: 'Make a small lift and keep your neck in line with your back.',
  },
  plank: {
    positions: [
      { label: 'Set your forearms', description: 'Start with knees down, elbows below shoulders.', pose: {
        head: [46, 138], shoulder: [68, 156], hip: [137, 178],
        arms: [[[65, 210], [104, 214]], [[78, 203], [115, 207]]],
        legs: [[[170, 212], [222, 213]], [[181, 204], [234, 205]]],
      } },
      { label: 'Straighten & hold', description: 'Lift knees and brace your stomach.', pose: {
        head: [46, 138], shoulder: [68, 156], hip: [143, 181],
        arms: [[[65, 210], [104, 214]], [[78, 203], [115, 207]]],
        legs: [[[190, 198], [236, 214]], [[199, 191], [246, 207]]],
      } },
    ], cue: 'Keep a straight line from head to heels. Breathe steadily.',
  },
  'side-plank': {
    positions: [
      { label: 'Lie on your side', description: 'Place your elbow below your shoulder; stack feet.', pose: {
        head: [54, 147], shoulder: [72, 172], hip: [145, 210],
        arms: [[[66, 211], [107, 214]], [[109, 174], [145, 202]]],
        legs: [[[192, 212], [242, 215]], [[193, 202], [242, 207]]],
      } },
      { label: 'Lift hips & hold', description: 'Press into your forearm and lift your hips.', pose: {
        head: [54, 125], shoulder: [72, 151], hip: [147, 179],
        arms: [[[66, 211], [107, 214]], [[111, 149], [147, 174]]],
        legs: [[[194, 197], [242, 215]], [[194, 188], [242, 206]]],
      } },
    ], cue: 'Keep shoulders, hips and feet in line. Repeat on the other side.',
  },
  'dead-bug': {
    positions: [
      { label: 'Arms up, knees bent', description: 'Lie back with knees above hips at 90°.', pose: deadBug },
      { label: 'Reach opposite limbs', description: 'Lower one arm and the opposite leg; return and switch.', pose: {
        ...deadBug, arms: [[[43, 196], [13, 190]], [[85, 171], [85, 132]]],
        legs: [[[151, 150], [203, 149]], [[190, 196], [243, 205]]],
      } },
    ], cue: 'Keep your lower back pressed into the floor.',
  },
  'bird-dog': {
    positions: [
      { label: 'Hands & knees', description: 'Hands below shoulders; knees below hips.', pose: handsAndKnees },
      { label: 'Reach & balance', description: 'Extend one arm and the opposite leg, then switch.', pose: {
        ...handsAndKnees,
        arms: [[[49, 133], [16, 132]], [[98, 173], [96, 211]]],
        legs: [[[178, 209], [228, 214]], [[216, 139], [254, 139]]],
      } },
    ], cue: 'Keep your hips level without twisting or arching your back.',
  },
  'bicycle-crunch': {
    positions: [
      { label: 'Twist to one knee', description: 'Bring one knee towards the opposite elbow.', pose: {
        head: [62, 155], shoulder: [82, 177], hip: [144, 207],
        arms: [[[49, 177], [57, 151]], [[110, 157], [74, 152]]],
        legs: [[[126, 153], [178, 155]], [[194, 194], [244, 199]]],
      } },
      { label: 'Switch sides', description: 'Extend that leg as the other knee comes in.', pose: {
        head: [62, 155], shoulder: [82, 177], hip: [144, 207],
        arms: [[[105, 156], [65, 148]], [[52, 184], [55, 158]]],
        legs: [[[195, 190], [245, 195]], [[128, 155], [179, 158]]],
      } },
    ], cue: 'Turn your upper body slowly; avoid pulling on your neck.',
  },
  'jumping-jacks': {
    positions: [
      { label: 'Feet together', description: 'Stand with your arms at your sides.', pose: {
        ...standing, legs: [[[135, 175], [132, 216]], [[145, 175], [148, 216]]],
      } },
      { label: 'Jump wide, arms up', description: 'Raise arms overhead; jump back and repeat.', pose: {
        ...standing, arms: [[[103, 43], [121, 15]], [[177, 43], [159, 15]]],
        legs: [[[103, 175], [72, 216]], [[177, 175], [208, 216]]],
      } },
    ], cue: 'Land softly with slightly bent knees.',
  },
  'high-knees': {
    positions: [
      { label: 'Drive one knee up', description: 'Lift towards hip height and pump the opposite arm.', pose: {
        ...standing, arms: [[[110, 103], [88, 126]], [[169, 100], [173, 71]]],
        legs: [[[84, 133], [87, 179]], [[155, 175], [162, 216]]],
      } },
      { label: 'Switch legs', description: 'Run on the spot, alternating knees and arms.', pose: {
        ...standing, arms: [[[111, 100], [107, 71]], [[170, 103], [192, 126]]],
        legs: [[[125, 175], [118, 216]], [[196, 133], [193, 179]]],
      } },
    ], cue: 'Stay tall and land softly on the balls of your feet.',
  },
  'mountain-climbers': {
    positions: [
      { label: 'High plank', description: 'Hands under shoulders, body in a straight line.', pose: highPlank },
      { label: 'Drive a knee in', description: 'Bring one knee towards your chest, then switch.', pose: {
        ...highPlank, legs: [[[106, 187], [157, 209]], [[198, 179], [244, 208]]],
      } },
    ], cue: 'Keep your hips low and your shoulders above your hands.',
  },
  'skater-hops': {
    positions: [
      { label: 'Land on one leg', description: 'Bend the landing knee; cross the other leg behind.', pose: {
        head: [112, 65], shoulder: [126, 90], hip: [151, 147],
        arms: [[[92, 118], [55, 131]], [[155, 111], [188, 94]]],
        legs: [[[123, 178], [102, 216]], [[187, 177], [209, 198]]],
      } },
      { label: 'Hop across', description: 'Hop sideways and land on your other leg.', pose: {
        head: [168, 65], shoulder: [154, 90], hip: [129, 147],
        arms: [[[188, 118], [225, 131]], [[125, 111], [92, 94]]],
        legs: [[[157, 178], [178, 216]], [[93, 177], [71, 198]]],
      } },
    ], cue: 'Land softly and find your balance before the next hop.',
  },
  burpee: {
    positions: [
      { label: 'Squat, hands down', description: 'From standing, crouch and place hands on the floor.', pose: {
        head: [119, 106], shoulder: [134, 132], hip: [182, 165],
        arms: [[[115, 175], [99, 214]], [[133, 175], [119, 212]]],
        legs: [[[140, 182], [179, 215]], [[158, 177], [198, 212]]],
      } },
      { label: 'Feet back to plank', description: 'Jump or step both feet behind you.', pose: highPlank },
      { label: 'Feet in', description: 'Bring feet back towards your hands.', pose: {
        head: [119, 106], shoulder: [134, 132], hip: [182, 165],
        arms: [[[115, 175], [99, 214]], [[133, 175], [119, 212]]],
        legs: [[[140, 182], [179, 215]], [[158, 177], [198, 212]]],
      } },
      { label: 'Stand & jump', description: 'Stand up, make a small jump and land softly.', pose: {
        head: [140, 34], shoulder: [140, 62], hip: [140, 125],
        arms: [[[110, 38], [120, 13]], [[170, 38], [160, 13]]],
        legs: [[[129, 164], [125, 201]], [[152, 164], [156, 201]]],
      } },
    ], cue: 'Repeat the sequence at a pace you can control.',
  },
  'leg-swings': {
    positions: [
      { label: 'Swing forward', description: 'Hold a wall; swing one leg gently in front.', pose: {
        ...standing, wall: true,
        arms: [[[99, 80], [64, 75]], [[164, 101], [167, 140]]],
        legs: [[[132, 175], [128, 216]], [[190, 137], [234, 140]]],
      } },
      { label: 'Swing back', description: 'Swing the same leg behind you, then repeat.', pose: {
        ...standing, wall: true,
        arms: [[[99, 80], [64, 75]], [[164, 101], [167, 140]]],
        legs: [[[132, 175], [128, 216]], [[102, 158], [60, 177]]],
      } },
    ], cue: 'Stay upright. Repeat on both legs, then swing side to side.',
  },
  'hip-flexor-stretch': {
    positions: [
      { label: 'Half-kneeling', description: 'One knee on the floor; front foot flat.', pose: {
        ...lunge, hip: [125, 151],
        legs: [[[185, 153], [185, 216]], [[125, 212], [66, 214]]],
      } },
      { label: 'Tuck & shift gently', description: 'Tuck your pelvis and shift hips slightly forward.', pose: {
        head: [149, 61], shoulder: [147, 89], hip: [139, 151],
        arms: [[[166, 120], [186, 148]], [[153, 122], [175, 151]]],
        legs: [[[188, 153], [185, 216]], [[125, 212], [66, 214]]],
      } },
    ], cue: 'Keep your torso tall. Hold, breathe, then switch sides.',
  },
  'cat-cow': {
    positions: [
      { label: 'Cow · breathe in', description: 'Gently lower your belly and lift your chest.', pose: {
        ...handsAndKnees, head: [57, 105], spine: 'M85 135 Q130 172 177 139',
      } },
      { label: 'Cat · breathe out', description: 'Round your back up and tuck your chin.', pose: {
        ...handsAndKnees, head: [61, 149], spine: 'M85 135 Q130 82 177 139',
      } },
    ], cue: 'Move slowly between the two shapes with your breath.',
  },
  'worlds-greatest-stretch': {
    positions: [
      { label: 'Deep lunge', description: 'Hands inside the front foot; bring the same-side elbow down.', pose: {
        head: [81, 117], shoulder: [105, 135], hip: [169, 151],
        arms: [[[81, 172], [67, 213]], [[124, 188], [89, 203]]],
        legs: [[[92, 158], [72, 216]], [[207, 182], [245, 214]]],
      } },
      { label: 'Rotate & reach', description: 'Reach that arm upwards and follow it with your eyes.', pose: {
        head: [87, 107], shoulder: [105, 133], hip: [169, 151],
        arms: [[[81, 172], [67, 213]], [[116, 87], [124, 40]]],
        legs: [[[92, 158], [72, 216]], [[207, 182], [245, 214]]],
      } },
    ], cue: 'Keep the supporting hand on the floor. Repeat on both sides.',
  },
} satisfies Record<string, ExerciseVisual>;

export type ExerciseId = keyof typeof EXERCISE_VISUALS;
