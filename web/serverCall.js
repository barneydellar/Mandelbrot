//-------------------------------------------------------------------------------------

function NewMandelbrot() {
    if (request_in_progress) {
        return;
    }
    StopColourLoop();

    NewMandelbrotImp(16);
}

function NewMandelbrotImp(factor) {

    zoom_factor = factor;
    fraction = 1 / zoom_factor;

    request_in_progress = true;

    fetch(
        "/Mandelbrot",
        {
            method: "POST",
            body: JSON.stringify({
                canvas_width: Math.ceil(full_w * fraction),
                canvas_height: Math.ceil(full_h * fraction),
                scale: scale * 1.01,
                x: offset_x,
                y: offset_y
            }),
            headers: { 'Content-Type': 'application/json' }
        }
    )
        .then(data => { return data.json() })
        .then(json_data => {
            escape_array = json_data["Array"];
            scale = json_data["Scale"];

            DrawCanvas();

            if (factor == 1) {
                StartColourLoop();
                request_in_progress = false;
                return;
            }
            factor = factor / 2;
            NewMandelbrotImp(factor);

        })
        .catch(function () {
            console.log("Failed to get data");
            request_in_progress = false;
        });
}
