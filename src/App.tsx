import { useRef, useState, useReducer, useEffect } from "react";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

function scalarMul<V extends number[]>(constant: number, vector: V): V {
	return vector.map((v) => v * constant) as V;
}

function vector2DAdd(
	a: [number, number],
	b: [number, number]
): [number, number] {
	return [a[0] + b[0], a[1] + b[1]];
}

function vector2DSub(
	a: [number, number],
	b: [number, number]
): [number, number] {
	return vector2DAdd(a, scalarMul(-1, b));
}

function hadamard2D(
	a: [number, number],
	b: [number, number]
): [number, number] {
	return [a[0] * b[0], a[1] * b[1]];
}

function invertY(v: [number, number]): [number, number] {
	return hadamard2D(v, [1, -1]);
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
	const [isClickingObject, setIsClickingObject] = useState(false);

	type Circle = {
		position: [number, number];
		active: boolean;
	};

	const circles = [
		{
			position: [0, 0] satisfies [number, number],
			active: false,
		},
	] satisfies Circle[];

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

					if (isMouseDown && !isClickingObject) {
						cameraPositionRef.current = [
							cameraPositionRef.current[0] -
								e.movementX / Math.E ** zoomRef.current,
							cameraPositionRef.current[1] +
								e.movementY / Math.E ** zoomRef.current,
						];
					}
				}}
			>
				<mesh
					onPointerDown={() => {
						setIsClickingObject(true);
					}}
					onPointerUp={() => {
						setIsClickingObject(false);
					}}
					position={[0, 0, 0]}
				>
					<meshBasicMaterial color={"red"} />
					<sphereBufferGeometry args={[0.5, 30, 30]} />
				</mesh>
				{circles.map(({ position, active }, index) => {
					function updateCircle() {}

					return (
						<mesh
							key={index}
							onPointerDown={() => {
								setIsClickingObject(true);
							}}
							onPointerUp={() => {
								setIsClickingObject(false);
							}}
							position={[...position, 0]}
						>
							<meshBasicMaterial color={active ? "green" : "red"} />
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
