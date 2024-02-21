const express = require('express');
const { Client } = require("ssh2");
const { privateKey, checkDockerExists, checkKubernetesExists, getDockerContainers, getKubernetesPods} = require("./public/process")

// const axios = require('axios');
const app = express();
const port = 3000;
const ip = "192.168.72.249"

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/connect',(req,res) => {
  console.log("here");
  const { user, host } = req.body;
   // SSH configuration
  const sshConfig = {
      host,
      port: 22,
      username: user,
      privateKey: privateKey,
      readyTimeout: 99999, // Adjust as needed
    };  
  const conn = new Client();
  console.log(`connecting to ${host}...`);
  conn
    .on("ready", async () => {
      console.log("SSH connection established");

      try {
        // Check if Docker and Kubernetes exist, then execute commands accordingly
        const [dockerExists, kubernetesExists] = await Promise.all([
          checkDockerExists(conn),
          checkKubernetesExists(conn),
        ]);

        // console.log("Docker Exists:", dockerExists);
        // console.log("Kubernetes Exists:", kubernetesExists);

        if (dockerExists === 1 ) {
          console.log(
            "Docker exists on the server. Proceeding to get Docker Containers."
          );
          const dockerData = await getDockerContainers(conn);
          // Set kubernetesExists to 0 since Docker is present
          // return { docker: dockerData};
          console.log('Docker Containers: \n',dockerData);
        } else if (kubernetesExists === 1 ) {
          console.log(
            "Kubernetes exists on the server. Proceeding to get Kubernetes Pods."
          );
          const kubernetesData = await getKubernetesPods(conn);
          // Set dockerExists to 0 since Kubernetes is present
          // return { kubernetes: kubernetesData };
          console.log('Kubernetes Pods: \n',kubernetesData);
        } else if (dockerExists === 1 && kubernetesExists === 1) {
          console.log(
            "Both Docker and Kubernetes exist on the server. Proceeding to get both."
          );
          const [dockerResult, kubernetesResult] = await Promise.all([
            getDockerContainers(conn),
            getKubernetesPods(conn),
          ]);
          // return { docker: dockerResult, kubernetes: kubernetesResult };
          console.log('Docker containers : \n',dockerResult);
          console.log('Kubernetes Pods : \n',kubernetesResult);
        } else {
          console.log("Neither Docker nor Kubernetes exists on the server.");
          return { docker: [], kubernetes: [] }; // Return empty data
        }
      } catch (err) {
        console.error("Error:", err);
        throw err;
      } finally {
        conn.end(); // Close the connection
      }
    })
    .on("error", (err) => {
      console.error("SSH connection error:", err);
      conn.end(); // Close the connection on error
    })
    .connect(sshConfig);
})

// app.get('/docker/ps', async (req, res) => {
//   try {
//     const response = await axios.get(`http://${ip}:2375/v1.43/containers/json`);
//     res.json(response.data);
//   } catch (error) {
//     console.log('Failed to fetch Docker container information')
//     res.status(500).json({ error: 'Failed to fetch Docker container information' });
//   }
// });

// app.get('/docker/logs/:id', async (req, res) => {
//   const id = req.params.id;
//   try {
//     const response = await axios.get(`http://${ip}:2375/v1.43/containers/${id}/logs?stdout=true&stderr=true`,{
// 		headers: {
//         		'Content-Type': 'application/json'
//     		}
// 	});
//     res.send(response.data);
//   } catch (error) {
//     console.log('Failed to fetch Docker container logs')
//     console.log(error)
//     res.status(500).json({ error: 'Failed to fetch Docker container logs' });
//   }
// });

app.listen(port, () => {
  console.log(`App listening at http://${ip}:${port}`);
});
