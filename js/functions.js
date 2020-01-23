function degrees_to_radians(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

function radians_to_degrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
}

function destinationPoint(lat, lng, distance, bearing) {

    const radius = 6371e3;
    // sinφ2 = sinφ1⋅cosδ + cosφ1⋅sinδ⋅cosθ
    // tanΔλ = sinθ⋅sinδ⋅cosφ1 / cosδ−sinφ1⋅sinφ2
    // see mathforum.org/library/drmath/view/52049.html for derivation

    const δ = distance / radius; // angular distance in radians
    const θ = degrees_to_radians(bearing);

    const φ1 = degrees_to_radians(lat), λ1 = degrees_to_radians(lng);

    const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
    const φ2 = Math.asin(sinφ2);
    const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
    const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
    const λ2 = λ1 + Math.atan2(y, x);

    const latRes = radians_to_degrees(φ2);
    const lonRes = radians_to_degrees(λ2);

    return [lonRes, latRes];
}


function getZoomForAltitude(altitude) {
    if(altitude>400){
        return 15
    }

    if(altitude>60){
        return 17
    }

    if(altitude>20){
        return 15
    }

    if(altitude>10){
        return 20
    }

    return 18;
}
