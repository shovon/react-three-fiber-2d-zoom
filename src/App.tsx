import { useRef, useState, useReducer, useEffect } from "react";
import "./App.css";
import { act, Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

function vector2DAdd(
	a: [number, number],
	b: [number, number]
): [number, number] {
	return [a[0] + b[0], a[1] + b[1]];
}

function App() {
	const [isMouseDown, setIsMouseDown] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const mousePositionRef = useRef<[number, number]>([NaN, NaN]);
	type State = {
		zoom: number;
		cameraPosition: [number, number];
	};
	const zoomRef = useRef<number>(4);
	const cameraPositionRef = useRef<[number, number]>([0, 0]);
	const [{ zoom, cameraPosition }, updateCamera] = useReducer<
		(state: State, partialState: Partial<State>) => State
	>(
		(state, partialState) => ({
			...state,
			...partialState,
		}),
		{ zoom: zoomRef.current, cameraPosition: cameraPositionRef.current }
	);
	const mouseDidDragRef = useRef(false);
	const objectMouseDownRef = useRef(false);

	type CircleState = "INACTIVE" | "JUST_ACTIVE" | "ACTIVE" | "MOVED";

	type Circle = {
		position: [number, number];
		active: CircleState;
	};

	const [circles, setCircles] = useState<Circle[]>([
		{
			position: [0, 0] satisfies [number, number],
			active: "INACTIVE",
		},
		{
			position: [-1, 1] satisfies [number, number],
			active: "INACTIVE",
		},
	]);

	useEffect(() => {
		function run() {
			return requestAnimationFrame(() => {
				updateCamera({
					zoom: zoomRef.current,
					cameraPosition: cameraPositionRef.current,
				});

				run();
			});
		}

		let animationFrame = run();

		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	}, []);

	// Rules:
	//
	// - user mouse downs on entity; entity is selected
	// - user mouse ups an entity
	//   a) if the mouse did not move
	//     a) if the entity was previously selected, deselect it
	//     b) if the entity was not previously selected, do nothing
	//   b) otherwise, do nothing
	// - user mouse downs on empty space; all entities are deselected

	return (
		<div className="App">
			<Canvas
				ref={canvasRef}
				onPointerMissed={() => {
					setCircles(circles.map((c) => ({ ...c, active: "INACTIVE" })));
				}}
				onWheel={(e) => {
					if (canvasRef.current) {
						const rect = canvasRef.current.getBoundingClientRect();

						const newZoom = zoomRef.current - e.deltaY * 0.001;

						const mousePositionCentered = [
							mousePositionRef.current[0] - rect.width / 2,
							-(mousePositionRef.current[1] - rect.height / 2),
						];

						const newMousePosition = [
							mousePositionCentered[0] * Math.E ** (newZoom - zoomRef.current),
							mousePositionCentered[1] * Math.E ** (newZoom - zoomRef.current),
						];

						const displacement = [
							newMousePosition[0] - mousePositionCentered[0],
							newMousePosition[1] - mousePositionCentered[1],
						];

						const newCameraPosition: [number, number] = [
							cameraPositionRef.current[0] +
								displacement[0] / Math.E ** newZoom,
							cameraPositionRef.current[1] +
								displacement[1] / Math.E ** newZoom,
						];

						cameraPositionRef.current = newCameraPosition;
						zoomRef.current = newZoom;
					}
				}}
				onPointerDown={(e) => {
					e.stopPropagation();
					(e.target as any).setPointerCapture(e.pointerId);
				}}
				onPointerUp={() => {
					mouseDidDragRef.current = false;
					objectMouseDownRef.current = false;
				}}
				onMouseDown={(e) => {
					setIsMouseDown(true);
				}}
				onMouseUp={() => {
					setIsMouseDown(false);
				}}
				onMouseLeave={() => {
					setIsMouseDown(false);
				}}
				onMouseMove={(e) => {
					if (canvasRef.current) {
						const rect = canvasRef.current.getBoundingClientRect();
						mousePositionRef.current[0] = e.clientX - rect.left;
						mousePositionRef.current[1] = e.clientY - rect.top;

						const mousePositionCentered = [
							mousePositionRef.current[0] - rect.width / 2,
							-(mousePositionRef.current[1] - rect.height / 2),
						];

						const mousePositionZoomed = [
							mousePositionCentered[0] / Math.E ** zoomRef.current,
							mousePositionCentered[1] / Math.E ** zoomRef.current,
						] satisfies [number, number];

						const mousePositionCamera = vector2DAdd(
							mousePositionZoomed,
							cameraPositionRef.current
						);
					}

					if (isMouseDown) {
						if (!objectMouseDownRef.current) {
							cameraPositionRef.current = [
								cameraPositionRef.current[0] -
									e.movementX / Math.E ** zoomRef.current,
								cameraPositionRef.current[1] +
									e.movementY / Math.E ** zoomRef.current,
							];
						} else {
							setCircles(
								circles.map((circle) => ({
									...circle,
									position: [
										circle.position[0] +
											e.movementX / Math.E ** zoomRef.current,
										circle.position[1] -
											e.movementY / Math.E ** zoomRef.current,
									],
								}))
							);
						}

						mouseDidDragRef.current = true;
					}
				}}
			>
				{circles.map(({ position, active }, index) => {
					function updateCircle(active: CircleState) {
						setCircles(
							circles.map((circle, i) =>
								i === index ? { ...circle, active } : circle
							)
						);
					}

					return (
						<mesh
							key={index}
							onPointerDown={() => {
								switch (active) {
									case "INACTIVE":
										updateCircle("JUST_ACTIVE");
										break;
								}
								objectMouseDownRef.current = true;
							}}
							onPointerUp={() => {
								switch (active) {
									case "ACTIVE":
										if (!mouseDidDragRef.current) {
											updateCircle("INACTIVE");
										}
										break;
									case "JUST_ACTIVE":
										updateCircle("ACTIVE");
								}
							}}
							position={[...position, 0]}
						>
							<meshBasicMaterial
								color={
									active === "ACTIVE" ||
									active === "MOVED" ||
									active === "JUST_ACTIVE"
										? "green"
										: "red"
								}
							/>
							<sphereBufferGeometry args={[0.5, 30, 30]} />
						</mesh>
					);
				})}
				<gridHelper rotation={[Math.PI / 2, 0, 0]} />
				<OrthographicCamera
					makeDefault
					position={[...cameraPosition, 10]}
					zoom={Math.E ** zoom}
				/>
			</Canvas>
		</div>
	);
}

export default App;
