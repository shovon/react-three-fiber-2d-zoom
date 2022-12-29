import { useRef, useState, Ref, useReducer, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";

function addVec2(a: [number, number], b: [number, number]): [number, number] {
	return [a[0] + b[0], a[1] + b[1]];
}

function scalarMulVec2(c: number, b: [number, number]): [number, number] {
	return [c * b[0], c * b[1]];
}

function subVec2(a: [number, number], b: [number, number]): [number, number] {
	return addVec2(a, scalarMulVec2(-1, b));
}

function hadamardVec2(
	a: [number, number],
	b: [number, number]
): [number, number] {
	return [a[0] * b[0], a[1] * b[1]];
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

	return (
		<div className="App">
			<Canvas
				ref={canvasRef}
				onWheel={(e) => {
					if (canvasRef.current) {
						const rect = canvasRef.current.getBoundingClientRect();

						const newZoom = zoomRef.current - e.deltaY * 0.001;

						const positionCanvas: [number, number] = [
							(mousePositionRef.current[0] - rect.width / 2) /
								Math.E ** zoomRef.current +
								cameraPositionRef.current[0],
							-(mousePositionRef.current[1] - rect.height / 2) /
								Math.E ** zoomRef.current +
								cameraPositionRef.current[1],
						];

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

						console.log(displacement);

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
				onMouseDown={() => {
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

						// const positionCanvas: [number, number] = [
						// 	(mousePositionRef.current[0] - rect.width / 2) /
						// 		Math.E ** zoomRef.current -
						// 		cameraPositionRef.current[0],
						// 	-(mousePositionRef.current[1] - rect.height / 2) /
						// 		Math.E ** zoomRef.current -
						// 		cameraPositionRef.current[1],
						// ];

						const positionCanvas: [number, number] = [
							(mousePositionRef.current[0] - rect.width / 2) /
								Math.E ** zoomRef.current +
								cameraPositionRef.current[0],
							-(mousePositionRef.current[1] - rect.height / 2) /
								Math.E ** zoomRef.current +
								cameraPositionRef.current[1],
						];

						// relativeMousePosition[0] = cameraPosition[0];
						// relativeMousePosition[1] = cameraPosition[1];

						console.log(cameraPositionRef.current, positionCanvas);
					}

					if (isMouseDown) {
						// updateCamera({
						// 	cameraPosition: [
						// 		cameraPosition[0] - e.movementX / Math.E ** zoomRef.current,
						// 		cameraPosition[1] + e.movementY / Math.E ** zoomRef.current,
						// 	],
						// });
						cameraPositionRef.current = [
							cameraPositionRef.current[0] -
								e.movementX / Math.E ** zoomRef.current,
							cameraPositionRef.current[1] +
								e.movementY / Math.E ** zoomRef.current,
						];
					}
				}}
			>
				<mesh>
					<meshBasicMaterial color={"red"} />
					<sphereBufferGeometry args={[1, 30, 30]} />
				</mesh>
				<gridHelper rotation={[Math.PI / 2, 0, 0]} />
				{/* <PerspectiveCamera makeDefault position={cameraPosition} /> */}
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
