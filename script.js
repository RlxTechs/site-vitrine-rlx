const cards = document.querySelectorAll(".card, .project-card");

cards.forEach((card) => {
  card.addEventListener("mousemove", () => {
    card.style.transform = "translateY(-6px) scale(1.01)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0) scale(1)";
  });
});

console.log("Site RLX Techs chargé avec succès 🚀");
