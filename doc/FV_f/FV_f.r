# linear regression to get estimate forage fill value in ration depending on energy::fillvalue
# UFL:FV (FV either in UEL or ULB) ration.
# Based on feed tables in
# Agabriel, J. (2010). Alimentation des bovins, ovins et caprins. Besoins des animaux - Valeurs
# des aliments. Tables INRA 2010. Editions Quae, France.

M <- as.matrix(read.csv("FV_f.csv", header = TRUE, sep = ";", dec = "."))
UEL <- as.numeric(M[,"UEL"])
UEB <- as.numeric(M[,"UEB"])
UFL_UEL <- as.numeric(M[,"UFL_UEL"])
UFL_UEB <- as.numeric(M[,"UFL_UEB"])

cor(UFL_UEL, UEL)
fit <- lm(UEL ~ UFL_UEL)
#pdf("UEL_f.pdf")
png("UEL_f.png", width = 500, height = 500, units = "px")
plot(UFL_UEL, UEL)
abline(fit)
s <- summary(fit)
lm_coef <- round(coef(fit), 3)
mtext(bquote(UEL == .(lm_coef[2])*UFL/UEL + .(lm_coef[1])), adj=1, padj=0)
mtext(bquote(r^2 == .(round(s$r.squared, 3))), adj=0, padj=0)
mtext(bquote(n == .(nrow(M))), adj=0.15, padj=0)
print(s)
dev.off()

cor(UFL_UEB, UEB)
fit <- lm(UEB ~ UFL_UEB)
#pdf("UEB_f.pdf")
png("UEB_f.png", width = 500, height = 500, units = "px")
plot(UFL_UEB, UEB)
abline(fit)
s <- summary(fit)
lm_coef <- round(coef(fit), 3)
mtext(bquote(UEB == .(lm_coef[2])*UFL/UEB + .(lm_coef[1])), adj=1, padj=0)
mtext(bquote(r^2 == .(round(s$r.squared, 3))), adj=0, padj=0)
mtext(bquote(n == .(nrow(M))), adj=0.15, padj=0)
print(s)
dev.off()
