uniform float uSize;
uniform float uTime;
uniform float uAudioLow;
uniform float uAudioHigh;

attribute float aScale;
attribute vec3 aRandomness;

varying vec3 vColor;

void main() {
            /**
             * Position
             */
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            //Spin //
            float angle = atan(modelPosition.x, modelPosition.z );
            float distanceToCenter = length(modelPosition.xz);
            float angleOffset = (1.0 / distanceToCenter) + uTime * 0.0005;
            angle += angleOffset + (uAudioHigh * .00002);
            modelPosition.x = cos(angle) * distanceToCenter + (uAudioHigh * .00002);
            modelPosition.z = sin(angle) * distanceToCenter;
            
            

            // Randomness
            modelPosition.xyz += aRandomness;

            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;

            /**
             * Size
             */
            gl_PointSize = uSize * aScale ;
            gl_PointSize *= ( 1.0 / - viewPosition.z * uAudioLow * .003) + .2;

            // Color //
            vColor = color;
        }