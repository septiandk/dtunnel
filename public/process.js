const { log } = require("console");
const fs = require("fs");

// Input: SSH connection details
// const user = "ubuntu";
// const host = "172.20.66.51";
const privateKeyPath = "./ssh-admin-snt.pem";

// Read private key file
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

const runCommand = (conn, command) =>
  new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = "";
      stream
        .on("close", () => {
          resolve(output); // Resolve with the entire output
        })
        .on("data", (data) => {
          output += data.toString();
        })
        .stderr.on("data", (data) => {
          console.error("STDERR:", data.toString());
          reject(new Error("Error in command execution"));
        });
    });
  });

const checkDockerExists = async (conn) => {
  const dockerCheckCommand = "command -v docker && echo 1 || echo 0";
  try {
    const output = await runCommand(conn, dockerCheckCommand);
    return output.includes("docker") ? 1 : 0;
  } catch (error) {
    console.error("Error checking Docker existence:", error);
    return 0;
  }
};

const checkKubernetesExists = async (conn) => {
  const kubernetesCheckCommand = "command -v kubectl && echo 1 || echo 0";
  try {
    const output = await runCommand(conn, kubernetesCheckCommand);
    return output.includes("kubectl") ? 1 : 0;
  } catch (error) {
    console.error("Error checking Kubernetes existence:", error);
    return 0;
  }
};

const getKubernetesPods = async (conn) => {
  const kubectlCommand =
    'sudo kubens snt | sudo kubectl get pods -o jsonpath="{range .items[*]}{.metadata.name}:{.status.phase}\n{end}"';
  try {
    const output = await runCommand(conn, kubectlCommand);
    // Parse the Kubernetes output and return a structured result
    const pods = output.trim().split("\n").filter(Boolean);
    const result = pods.map((pod) => {
      const [name, phase] = pod.split(":");
      return { name: name.trim(), phase: phase.trim() };
    });
    return result;
  } catch (error) {
    console.error("Error getting Kubernetes pods:", error);
    return [];
  }
};

const getDockerContainers = async (conn) => {
  const dockerCommand = 'sudo docker ps --format "{{.ID}}: {{.Names}}"';
  try {
    const output = await runCommand(conn, dockerCommand);
    // Parse the Docker output and return a structured result
    const containers = output.trim().split("\n").filter(Boolean);
    const result = containers.map((container) => {
      const [id, name] = container.split(":");
      return { id: id.trim(), name: name.trim() };
    });
    return result;
  } catch (error) {
    console.error("Error getting Docker containers:", error);
    return [];
  }
};


module.exports = { privateKey, checkDockerExists, checkKubernetesExists, getDockerContainers, getKubernetesPods}