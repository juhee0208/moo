// MOO CI/CD 파이프라인 (Multibranch Pipeline 기준)
// 사전 준비: 'docker-mobile-agent' Agent, Credentials 'docker-registry' / 'staging-ssh-key'
// 스테이징 서버에는 infra/ 내용을 /opt/moo/ 에 복사하고 .env 를 채워 둔다.

pipeline {
    agent { label 'docker-mobile-agent' }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        REGISTRY      = 'registry.example.com'
        IMAGE_REPO    = 'registry.example.com/team/moo-api'
        IMAGE_TAG     = "${BUILD_NUMBER}"
        FLUTTER_IMAGE = 'ghcr.io/cirruslabs/flutter:YOUR_PINNED_TAG' // 프로젝트 Flutter 버전으로 고정
        STAGING_HOST  = 'deploy@staging.example.com'
        STAGING_API   = 'https://stg-api.example.com'
    }

    stages {
        stage('Backend Test') {
            steps {
                sh '''
                    docker run --rm -v "$WORKSPACE/backend:/work" -w /work node:24-alpine \
                      sh -lc 'npm ci && npm test'
                '''
            }
        }

        // app/pubspec.yaml 이 생기기 전(Flutter 프로젝트 생성 전)에는 건너뛴다
        stage('Flutter Test') {
            when { expression { fileExists('app/pubspec.yaml') } }
            steps {
                sh '''
                    docker run --rm -v "$WORKSPACE/app:/work" -w /work "$FLUTTER_IMAGE" \
                      sh -lc 'flutter pub get && flutter analyze && flutter test'
                '''
            }
        }

        stage('Flutter Build (Android)') {
            when {
                allOf {
                    branch 'main'
                    expression { fileExists('app/pubspec.yaml') }
                }
            }
            steps {
                sh '''
                    docker run --rm -v "$WORKSPACE/app:/work" -w /work "$FLUTTER_IMAGE" \
                      sh -lc "flutter pub get && flutter build appbundle --release --dart-define=API_BASE_URL=$STAGING_API"
                '''
                archiveArtifacts artifacts: 'app/build/app/outputs/bundle/release/*.aab', fingerprint: true
            }
        }

        stage('Backend Docker Build') {
            steps {
                sh 'docker build --pull -t "$IMAGE_REPO:$IMAGE_TAG" ./backend'
            }
        }

        stage('Docker Push') {
            when { branch 'main' }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-registry',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASSWORD'
                )]) {
                    sh '''
                        echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$REGISTRY_USER" --password-stdin
                        docker push "$IMAGE_REPO:$IMAGE_TAG"
                        docker logout "$REGISTRY"
                    '''
                }
            }
        }

        stage('Deploy Staging') {
            when { branch 'main' }
            steps {
                sshagent(credentials: ['staging-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=yes "$STAGING_HOST" \
                          "/opt/moo/scripts/deploy.sh $IMAGE_REPO:$IMAGE_TAG"
                    '''
                }
            }
        }

        stage('Smoke Test') {
            when { branch 'main' }
            steps {
                sh 'curl --fail --retry 10 --retry-delay 3 --retry-all-errors "$STAGING_API/health"'
            }
        }
    }
}
