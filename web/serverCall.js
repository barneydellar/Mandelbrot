//-------------------------------------------------------------------------------------

function NewMandelbrot() {

    request_in_progress = true;
    document.body.style.cursor = 'wait';
    StopColourLoop();
    NewMandelbrotImp(4);
}

function NewMandelbrotImp(factor) {

    zoom_factor = factor;
    fraction = 1 / zoom_factor;

    fetch(
        "/Mandelbrot",
        {
            method: "POST",
            body: JSON.stringify({
                canvas_width: Math.ceil(full_w * fraction),
                canvas_height: Math.ceil(full_h * fraction),
                scale: scale,
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
                document.body.style.cursor = 'default';
                return;
            }
            factor = Math.round(factor / 2);
            NewMandelbrotImp(factor);
        })
        .catch(function () {
            console.log("Failed to get data");
            request_in_progress = false;
            document.body.style.cursor = 'default';
        });
}
