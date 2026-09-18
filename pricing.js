document.addEventListener("DOMContentLoaded", function () {
  const categorySelect = document.getElementById("categorySelect");
  const difficultySelect = document.getElementById("difficultySelect");
  const hoursSelect = document.getElementById("taskHours");
  const marketPrice = document.getElementById("marketPrice");
  const labourPrice = document.getElementById("labourPrice");
  const suggestedPrice = document.getElementById("suggestedPrice");

  const pricing = {
    "Assignment Help": { marketMin: 150, marketMax: 350, labour: 100 },
    "Research Assistant": { marketMin: 300, marketMax: 800, labour: 250 },
    "PPT Design": { marketMin: 200, marketMax: 600, labour: 150 },
    "Online Tutoring": { marketMin: 150, marketMax: 500, labour: 120 },
    "Resume & CV Writing": { marketMin: 150, marketMax: 500, labour: 100 },
    "Graphic Design": { marketMin: 250, marketMax: 800, labour: 180 },
    "Logo Design": { marketMin: 250, marketMax: 800, labour: 180 },
    "Video Editing": { marketMin: 300, marketMax: 1000, labour: 250 },
    "Translation": { marketMin: 150, marketMax: 500, labour: 100 },
    "Data Entry": { marketMin: 100, marketMax: 350, labour: 80 },
    "Web Development": { marketMin: 500, marketMax: 1500, labour: 400 },
    "App Development": { marketMin: 800, marketMax: 2500, labour: 600 },
    "Content Writing": { marketMin: 150, marketMax: 600, labour: 100 },
    "AI & Automation": { marketMin: 300, marketMax: 1500, labour: 250 }
  };

  function updatePricing() {
    const category = categorySelect.value;
    if (!category || !pricing[category]) {
      marketPrice.textContent = "Select a category";
      labourPrice.textContent = "Select a category";
      suggestedPrice.textContent = "Select a category";
      return;
    }

    let marketMin = pricing[category].marketMin;
    let marketMax = pricing[category].marketMax;
    let labour = pricing[category].labour;
    const difficulty = difficultySelect.value;

    if (difficulty === "Medium") { marketMin *= 1.25; marketMax *= 1.25; labour *= 1.20; }
    if (difficulty === "Hard") { marketMin *= 1.50; marketMax *= 1.50; labour *= 1.50; }
    if (difficulty === "Expert") { marketMin *= 1.75; marketMax *= 1.75; labour *= 1.75; }

    const timeMultiplier = { "30 Minutes": 1, "1 Hour": 1, "2 Hours": 1.5, "4 Hours": 2, "8 Hours": 3, "12+ Hours": 4 };
    const multiplier = timeMultiplier[hoursSelect.value] || 1;
    marketMin = Math.round(marketMin * multiplier);
    marketMax = Math.round(marketMax * multiplier);
    labour = Math.round(labour * multiplier);
    const suggested = Math.round(Math.max(((marketMin + marketMax) / 2) * 0.70, labour));

    marketPrice.textContent = "₹" + marketMin.toLocaleString("en-IN") + " – ₹" + marketMax.toLocaleString("en-IN");
    labourPrice.textContent = "₹" + labour.toLocaleString("en-IN");
    suggestedPrice.textContent = "₹" + suggested.toLocaleString("en-IN");
  }

  categorySelect.addEventListener("change", updatePricing);
  difficultySelect.addEventListener("change", updatePricing);
  hoursSelect.addEventListener("change", updatePricing);
  updatePricing();
  window.updatePricing = updatePricing;

  const form = document.getElementById("taskForm");
  if (!form || !window.supabaseClient) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const message = document.getElementById("taskFormMessage");
    const button = document.getElementById("postTaskButton");
    const fileInput = document.getElementById("taskFile");
    const file = fileInput?.files?.[0] || null;

    message.className = "mt-3 alert alert-info";
    message.textContent = "Posting your task...";
    button.disabled = true;

    try {
      if (file && file.size > 10 * 1024 * 1024) throw new Error("File is too large. Please upload a file up to 10 MB.");

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.user) throw new Error("You are not logged in. Please log in before posting a task.");

      const task = {
        title: document.getElementById("taskTitle").value.trim(),
        category: categorySelect.value,
        description: document.getElementById("taskDescription").value.trim(),
        difficulty: difficultySelect.value,
        estimated_time: hoursSelect.value,
        budget: Number(document.getElementById("customerBudget").value),
        status: "open",
        customer_name: document.getElementById("customerName").value.trim(),
        customer_email: document.getElementById("customerEmail").value.trim(),
        customer_phone: document.getElementById("customerPhone").value.trim() || null,
        deadline: document.getElementById("deadline").value,
        user_id: session.user.id
      };

      const { data: insertedTask, error: insertError } = await supabaseClient.from("tasks").insert(task).select("id").single();
      if (insertError) throw insertError;

      let attachmentPath = null;
      let attachmentName = null;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        attachmentPath = `${session.user.id}/${insertedTask.id}-${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabaseClient.storage.from("task-attachments").upload(attachmentPath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false
        });
        if (uploadError) {
          await supabaseClient.from("tasks").delete().eq("id", insertedTask.id);
          throw new Error("The task was not saved because the attachment could not be uploaded: " + uploadError.message);
        }
        attachmentName = file.name;
        const { error: updateError } = await supabaseClient.from("tasks").update({ attachment_path: attachmentPath, attachment_name: attachmentName }).eq("id", insertedTask.id).eq("user_id", session.user.id);
        if (updateError) {
          await supabaseClient.storage.from("task-attachments").remove([attachmentPath]);
          await supabaseClient.from("tasks").delete().eq("id", insertedTask.id);
          throw updateError;
        }
      }

      const { error: notificationError } = await supabaseClient.functions.invoke("task-notification", { body: { task_id: insertedTask.id } });
      if (notificationError) {
        console.error("Task notification error:", notificationError);
        message.className = "mt-3 alert alert-warning";
        message.textContent = "Task posted successfully" + (file ? " with attachment" : "") + ", but the email notification failed. Please check your Task-Window email.";
      } else {
        message.className = "mt-3 alert alert-success";
        message.textContent = "Your task has been posted successfully" + (file ? " and your document was uploaded." : ".") + " Task-Window has been notified.";
      }

      form.reset();
      updatePricing();
    } catch (error) {
      console.error("Task posting error:", error);
      message.className = "mt-3 alert alert-danger";
      message.textContent = error?.message || error?.details || "Unable to post the task.";
    } finally {
      button.disabled = false;
    }
  }, true);
});