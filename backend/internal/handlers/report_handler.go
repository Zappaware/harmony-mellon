package handlers

import (
	"fmt"
	"mellon-harmony-api/internal/models"
	"mellon-harmony-api/internal/repository"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
)

type ReportHandler struct {
	clientRepo  repository.ClientRepository
	projectRepo repository.ProjectRepository
	userRepo    repository.UserRepository
}

func NewReportHandler(clientRepo repository.ClientRepository, projectRepo repository.ProjectRepository, userRepo repository.UserRepository) *ReportHandler {
	return &ReportHandler{
		clientRepo:  clientRepo,
		projectRepo: projectRepo,
		userRepo:    userRepo,
	}
}

func (h *ReportHandler) DownloadClientReportFiltered(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID"})
		return
	}

	month := c.Query("month")
	year := c.Query("year")
	if month == "" || year == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "month and year query params are required"})
		return
	}
	var monthInt, yearInt int
	if _, err := fmt.Sscanf(month, "%d", &monthInt); err != nil || monthInt < 1 || monthInt > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month (1-12)"})
		return
	}
	if _, err := fmt.Sscanf(year, "%d", &yearInt); err != nil || yearInt < 2000 || yearInt > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year"})
		return
	}

	currentUser, err := GetCurrentUserFromDB(c, h.userRepo)
	if err != nil || currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no encontrado"})
		return
	}
	if currentUser.Role != models.RoleAdmin && currentUser.Role != models.RoleTeamLead {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores y líderes de equipo pueden descargar reportes"})
		return
	}

	_, err = h.clientRepo.GetByID(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	projects, err := h.projectRepo.GetByClientIDAndMonthYear(clientID, monthInt, yearInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	f := excelize.NewFile()
	sheetName := "Reporte"
	index, _ := f.GetSheetIndex("Sheet1")
	if index >= 0 {
		f.SetSheetName("Sheet1", sheetName)
	}

	headers := []string{"Proyecto", "Tipo", "Mes/Año", "Tarea", "Tipo Tarea", "Estado", "Prioridad", "Asignado", "Fecha Inicio", "Fecha Vencimiento", "Aprobada", "Descripción"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}
	f.SetRowHeight(sheetName, 1, 20)

	row := 2
	for _, project := range projects {
		monthYearStr := ""
		if project.PlanningMonth != nil && project.PlanningYear != nil {
			monthYearStr = monthLabel(*project.PlanningMonth) + " " + fmt.Sprintf("%d", *project.PlanningYear)
		}
		projectType := project.Type
		if projectType == "" {
			projectType = "Campaña"
		}

		if len(project.Issues) == 0 {
			_ = setRow(f, sheetName, row, project.Name, projectType, monthYearStr, "", "", "", "", "", "", "", project.Description)
			row++
		} else {
			for _, issue := range project.Issues {
				assignee := ""
				if issue.Assignee != nil {
					assignee = issue.Assignee.Name
				}
				startDate := ""
				if issue.StartDate != nil {
					startDate = issue.StartDate.Format("2006-01-02")
				}
				dueDate := ""
				if issue.DueDate != nil {
					dueDate = issue.DueDate.Format("2006-01-02")
				}
				approved := "No"
				if issue.ApprovedAt != nil {
					approved = "Sí"
				}
				_ = setRow(f, sheetName, row, project.Name, projectType, monthYearStr, issue.Title, issue.TaskType, string(issue.Status), string(issue.Priority), assignee, startDate, dueDate, approved, issue.Description)
				row++
			}
		}
	}

	f.SetColWidth(sheetName, "A", "A", 30)
	f.SetColWidth(sheetName, "B", "B", 12)
	f.SetColWidth(sheetName, "C", "C", 15)
	f.SetColWidth(sheetName, "D", "D", 35)
	f.SetColWidth(sheetName, "E", "E", 18)
	f.SetColWidth(sheetName, "F", "F", 15)
	f.SetColWidth(sheetName, "G", "G", 12)
	f.SetColWidth(sheetName, "H", "H", 20)
	f.SetColWidth(sheetName, "I", "J", 14)
	f.SetColWidth(sheetName, "K", "K", 10)
	f.SetColWidth(sheetName, "L", "L", 50)

	style, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#E0E7FF"}, Pattern: 1},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})
	_ = f.SetCellStyle(sheetName, "A1", "L1", style)

	buf, err := f.WriteToBuffer()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fileName := "Historial_" + monthLabel(monthInt) + "_" + fmt.Sprintf("%d", yearInt) + "_" + time.Now().Format("2006-01-02") + ".xlsx"
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ReportHandler) DownloadClientReport(c *gin.Context) {
	clientID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid client ID"})
		return
	}

	projectType := c.Param("type")
	if projectType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project type is required"})
		return
	}

	currentUser, err := GetCurrentUserFromDB(c, h.userRepo)
	if err != nil || currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no encontrado"})
		return
	}
	if currentUser.Role != models.RoleAdmin && currentUser.Role != models.RoleTeamLead {
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo administradores y líderes de equipo pueden descargar reportes"})
		return
	}

	_, err = h.clientRepo.GetByID(clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Client not found"})
		return
	}

	projects, err := h.projectRepo.GetByClientIDAndType(clientID, projectType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	f := excelize.NewFile()
	sheetName := "Reporte"
	index, _ := f.GetSheetIndex("Sheet1")
	if index >= 0 {
		f.SetSheetName("Sheet1", sheetName)
	}

	headers := []string{"Proyecto", "Mes/Año", "Tarea", "Tipo Tarea", "Estado", "Prioridad", "Asignado", "Fecha Inicio", "Fecha Vencimiento", "Aprobada", "Descripción"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}
	f.SetRowHeight(sheetName, 1, 20)

	row := 2
	for _, project := range projects {
		monthYearStr := ""
		if project.PlanningMonth != nil && project.PlanningYear != nil {
			monthYearStr = monthLabel(*project.PlanningMonth) + " " + fmt.Sprintf("%d", *project.PlanningYear)
		}

		if len(project.Issues) == 0 {
			_ = setRow(f, sheetName, row, project.Name, monthYearStr, "", "", "", "", "", "", "", project.Description)
			row++
		} else {
			for _, issue := range project.Issues {
				assignee := ""
				if issue.Assignee != nil {
					assignee = issue.Assignee.Name
				}
				startDate := ""
				if issue.StartDate != nil {
					startDate = issue.StartDate.Format("2006-01-02")
				}
				dueDate := ""
				if issue.DueDate != nil {
					dueDate = issue.DueDate.Format("2006-01-02")
				}
				approved := "No"
				if issue.ApprovedAt != nil {
					approved = "Sí"
				}
				_ = setRow(f, sheetName, row, project.Name, monthYearStr, issue.Title, issue.TaskType, string(issue.Status), string(issue.Priority), assignee, startDate, dueDate, approved, issue.Description)
				row++
			}
		}
	}

	f.SetColWidth(sheetName, "A", "A", 30)
	f.SetColWidth(sheetName, "B", "B", 15)
	f.SetColWidth(sheetName, "C", "C", 35)
	f.SetColWidth(sheetName, "D", "D", 18)
	f.SetColWidth(sheetName, "E", "E", 15)
	f.SetColWidth(sheetName, "F", "F", 12)
	f.SetColWidth(sheetName, "G", "G", 20)
	f.SetColWidth(sheetName, "H", "I", 14)
	f.SetColWidth(sheetName, "J", "J", 10)
	f.SetColWidth(sheetName, "K", "K", 50)

	style, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#E0E7FF"}, Pattern: 1},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})
	_ = f.SetCellStyle(sheetName, "A1", "K1", style)

	buf, err := f.WriteToBuffer()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fileName := "Historial_" + projectType + "_" + time.Now().Format("2006-01-02") + ".xlsx"
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func setRow(f *excelize.File, sheet string, row int, vals ...string) error {
	for i, v := range vals {
		cell, _ := excelize.CoordinatesToCellName(i+1, row)
		f.SetCellValue(sheet, cell, v)
	}
	return nil
}

func monthLabel(m int) string {
	labels := map[int]string{
		1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
		7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
	}
	if l, ok := labels[m]; ok {
		return l
	}
	return ""
}

