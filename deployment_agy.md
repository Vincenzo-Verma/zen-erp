# SaaS ERP Deployment Guide: Oracle Cloud (OKE), GitHub Actions & Cloudflare

This guide outlines the complete process for deploying the SaaS ERP application to a Kubernetes cluster on Oracle Cloud Infrastructure (OCI), automating deployments via GitHub Actions, and securing your Hostinger-purchased domain with Cloudflare's DDoS protection and SSL.

## 1. Prerequisites

- **Oracle Cloud Account:** Active OCI account with privileges to create OKE (Oracle Kubernetes Engine) clusters.
- **GitHub Repository:** The ERP source code hosted on GitHub.
- **Hostinger Domain:** A domain purchased via Hostinger.
- **Cloudflare Account:** A free or paid Cloudflare account.
- **Docker Registry:** A registry to store your Docker images (e.g., Docker Hub, GitHub Container Registry (GHCR), or OCI Container Registry).

---

## 2. Cloudflare & Hostinger Domain Setup (SSL & DDoS Protection)

To leverage Cloudflare for DDoS protection and secure SSL routing of traffic to your Kubernetes cluster:

### Step 2.1: Route Hostinger Domain to Cloudflare
1. Log in to your **Cloudflare Dashboard** and click **"Add a Site"**.
2. Enter your Hostinger domain name (e.g., `yourdomain.com`).
3. Cloudflare will scan your existing DNS records. Verify them and proceed.
4. Cloudflare will provide you with **two Nameservers** (e.g., `ns1.cloudflare.com`, `ns2.cloudflare.com`).
5. Log in to your **Hostinger Dashboard**.
6. Go to **Domains -> [Your Domain] -> DNS/Nameservers**.
7. Change the nameservers from Hostinger's default to the ones provided by Cloudflare.
8. Wait for DNS propagation (can take anywhere from a few minutes to 24 hours).

### Step 2.2: Configure SSL and DDoS Protection in Cloudflare
1. In Cloudflare, navigate to the **SSL/TLS** tab.
2. Set the encryption mode to **Full (Strict)**. This ensures traffic is securely encrypted from the user to Cloudflare, and from Cloudflare directly to your Kubernetes cluster.
3. *Note:* You will need a valid SSL certificate on your Kubernetes Ingress (using Let's Encrypt / Cert-Manager) for `Full (Strict)` to work properly without 526 errors.
4. Navigate to the **Security -> Settings** tab. Keep the "Security Level" at **Medium** generally, or set it to **Under Attack Mode** if you are actively mitigating a DDoS attack.
5. In the **DNS** tab, ensure the proxy status (the orange cloud icon) is **Proxied** for your `A` records or `CNAME` records pointing to your Kubernetes Ingress IP.

---

## 3. Oracle Cloud Kubernetes (OKE) Setup

### Step 3.1: Create the Cluster
1. Log in to the **Oracle Cloud Console**.
2. Navigate to **Developer Services -> Kubernetes Clusters (OKE)**.
3. Click **Create Cluster** and choose the **Quick Create** workflow.
4. Configure the cluster:
   - **Name:** `saas-erp-cluster`
   - **Kubernetes Version:** Choose the latest stable version.
   - **Node Shape:** Select a compute shape (e.g., `VM.Standard.A1.Flex` for ARM or standard AMD/Intel shapes) depending on your application requirements.
   - **Number of Nodes:** Select at least 2 worker nodes for high availability.
5. Click **Submit** and wait for the cluster and node pool to be fully provisioned.

### Step 3.2: Configure `kubectl` Access
1. Once the cluster is active, click the **Access Cluster** button in the OCI dashboard.
2. Follow the instructions to configure your local `kubeconfig` using the OCI CLI.
   ```bash
   oci ce cluster create-kubeconfig --cluster-id <YOUR_CLUSTER_OCID> --file ~/.kube/config --region <YOUR_REGION> --token-version 2.0.0 --kube-endpoint PUBLIC_ENDPOINT
   ```

### Step 3.3: Set Up NGINX Ingress and Cert-Manager
To route traffic from Cloudflare into your cluster securely:
1. **Install NGINX Ingress Controller:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```
2. Get the External IP of your LoadBalancer attached to the Ingress Controller:
   ```bash
   kubectl get svc -n ingress-nginx ingress-nginx-controller
   ```
   *Take this External IP and create an `A` record in your Cloudflare DNS settings pointing to this IP.*

3. **Install Cert-Manager (for SSL certificates):**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.1/cert-manager.yaml
   ```
4. Create a ClusterIssuer for Let's Encrypt to issue certificates to your cluster, satisfying Cloudflare's `Full (Strict)` mode requirements.

---

## 4. GitHub Actions CI/CD Pipeline

To automate deployments to your Oracle OKE cluster upon committing to the `main` branch, we will configure a GitHub Actions workflow.

### Step 4.1: GitHub Repository Secrets
First, add the following secrets to your GitHub repository by navigating to **Settings -> Secrets and variables -> Actions**:
- `OCI_CLI_USER`: Your OCI user OCID.
- `OCI_CLI_TENANCY`: Your OCI tenancy OCID.
- `OCI_CLI_FINGERPRINT`: Your OCI API key fingerprint.
- `OCI_CLI_KEY_CONTENT`: The raw PEM-formatted private key for your OCI API key.
- `OCI_CLI_REGION`: Your OCI region (e.g., `us-ashburn-1`).
- `OKE_CLUSTER_OCID`: The OCID of your Kubernetes cluster.
- `DOCKER_USERNAME`: Your Docker Hub/Registry username.
- `DOCKER_PASSWORD`: Your Docker Hub/Registry password or standard access token.

### Step 4.2: Workflow File (`.github/workflows/deploy.yml`)
Create a file at `.github/workflows/deploy.yml` in your repository with the following configuration. This example builds your services and deploys them to OKE.

```yaml
name: Deploy ERP to Oracle OKE

on:
  push:
    branches:
      - main

env:
  IMAGE_TAG: ${{ github.sha }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v3

      - name: Log in to Docker Registry
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      # Build and push your Docker container(s)
      - name: Build and Push Gateway Services
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile.gateway
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/saas-erp-gateway:${{ env.IMAGE_TAG }},${{ secrets.DOCKER_USERNAME }}/saas-erp-gateway:latest

      # Configure Oracle Cloud CLI
      - name: Configure OCI CLI
        uses: oracle-actions/configure-oci-cli@v1.1.1
        with:
          tenancy: ${{ secrets.OCI_CLI_TENANCY }}
          user: ${{ secrets.OCI_CLI_USER }}
          fingerprint: ${{ secrets.OCI_CLI_FINGERPRINT }}
          key_file_content: ${{ secrets.OCI_CLI_KEY_CONTENT }}
          region: ${{ secrets.OCI_CLI_REGION }}

      # Get kubeconfig for OKE Cluster Authorization
      - name: Get Kubeconfig
        run: |
          mkdir -p ~/.kube
          oci ce cluster create-kubeconfig --cluster-id ${{ secrets.OKE_CLUSTER_OCID }} --file ~/.kube/config --region ${{ secrets.OCI_CLI_REGION }} --token-version 2.0.0 --kube-endpoint PUBLIC_ENDPOINT
          chmod 600 ~/.kube/config

      # Deploy Manifests to Kubernetes Database
      - name: Deploy to OKE
        run: |
          # Update the images in your deployment manifests with the newly built image tags
          sed -i "s|<YOUR_REGISTRY>/saas-erp-gateway:latest|${{ secrets.DOCKER_USERNAME }}/saas-erp-gateway:${{ env.IMAGE_TAG }}|g" k8s/gateway-deployment.yaml
          
          # Apply the manifests to the cluster
          kubectl apply -f k8s/
          
          # Verify the rollout deployment status
          kubectl rollout status deployment/gateway-deployment
```

### Step 4.3: Architecture of Kubernetes Manifests
You will need to create standard Kubernetes manifests (Deployments, Services, and Ingress) in a `k8s/` folder inside your repo.

Here is an example `k8s/ingress.yaml`:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: erp-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: erp-tls-secret
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-service
            port: 
              number: 8080
```

## Summary Deployment Flow
1. **Push Code**: You push changes to the `main` branch.
2. **GitHub Actions execution**: The pipeline builds Docker images for your ERP microservices, pushes them to the public/private registry, and safely executes update commands to your OKE cluster using `kubectl`.
3. **Traffic Flow Analysis**: 
   - User goes to `yourdomain.com`.
   - Traffic routes through **Cloudflare** (DDoS mitigation applied implicitly, and cached resources served).
   - Cloudflare encrypts traffic (`Full (Strict)`) and proxies it to your **Oracle OKE NGINX Ingress External IP**.
   - Ingress securely routes the traffic to the relevant microservices running the SaaS ERP.
