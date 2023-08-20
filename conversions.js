const euclideanMod =  (numerator, denominator) => {
    const result = numerator % denominator;
    return result < 0 ? result + denominator : result;
};
const PI = Math.PI;
const PI_2 = Math.PI * 2;
const TO_RAD = PI / 180;
const TO_DEG = 1 / TO_RAD;

exports.toRadians = toRadians;
exports.toDegrees = toDegrees;
exports.fromNotchianYaw = (yaw) => {
    return euclideanMod(PI - toRadians(yaw), PI_2);
};
exports.fromNotchianPitch = (pitch) => {
    return euclideanMod(toRadians(-pitch) + PI, PI_2) - PI;
};
exports.toNotchianYaw = yaw => toDegrees(PI - yaw);
exports.toNotchianPitch = pitch => toDegrees(-pitch);

function toRadians (degrees) {
    return TO_RAD * degrees;
}
function toDegrees (radians) {
    return TO_DEG * radians;
}